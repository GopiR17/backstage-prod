/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { JsonObject } from '@backstage/types';
import { resolvePackagePath } from '@backstage/backend-common';
import { ConflictError, NotFoundError } from '@backstage/errors';
import { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import {
  SerializedTaskEvent,
  SerializedTask,
  TaskStatus,
  TaskEventType,
  TaskStore,
  TaskStoreEmitOptions,
  TaskStoreListEventsOptions,
  TaskStoreCreateTaskOptions,
  TaskStoreCreateTaskResult,
} from './types';
import { DateTime } from 'luxon';

const migrationsDir = resolvePackagePath(
  '@backstage/plugin-scaffolder-backend',
  'migrations',
);

export type RawDbTaskRow = {
  id: string;
  spec: string;
  status: TaskStatus;
  last_heartbeat_at?: string;
  created_at: string;
  created_by: string | null;
  secrets?: string | null;
};

export type RawDbTaskEventRow = {
  id: number;
  task_id: string;
  body: string;
  event_type: TaskEventType;
  created_at: string;
};

/**
 * DatabaseTaskStore
 *
 * @public
 */
export type DatabaseTaskStoreOptions = {
  database: Knex;
};

const parseSqlDateToIsoString = <T>(input: T): T | string => {
  if (typeof input === 'string') {
    return DateTime.fromSQL(input, { zone: 'UTC' }).toISO();
  }

  return input;
};

/**
 * DatabaseTaskStore
 *
 * @public
 */
export class DatabaseTaskStore implements TaskStore {
  private readonly db: Knex;

  static async create(
    options: DatabaseTaskStoreOptions,
  ): Promise<DatabaseTaskStore> {
    await options.database.migrate.latest({
      directory: migrationsDir,
    });
    return new DatabaseTaskStore(options);
  }

  private constructor(options: DatabaseTaskStoreOptions) {
    this.db = options.database;
  }

  async list(options: {
    createdBy?: string;
  }): Promise<{ tasks: SerializedTask[] }> {
    const queryBuilder = this.db<RawDbTaskRow>('tasks');

    if (options.createdBy) {
      queryBuilder.where({
        created_by: options.createdBy,
      });
    }

    const results = await queryBuilder.orderBy('created_at', 'desc').select();

    const tasks = results.map(result => ({
      id: result.id,
      spec: JSON.parse(result.spec),
      status: result.status,
      createdBy: result.created_by ?? undefined,
      lastHeartbeatAt: parseSqlDateToIsoString(result.last_heartbeat_at),
      createdAt: parseSqlDateToIsoString(result.created_at),
    }));

    return { tasks };
  }

  async getTask(taskId: string): Promise<SerializedTask> {
    const [result] = await this.db<RawDbTaskRow>('tasks')
      .where({ id: taskId })
      .select();
    if (!result) {
      throw new NotFoundError(`No task with id '${taskId}' found`);
    }
    try {
      const spec = JSON.parse(result.spec);
      const secrets = result.secrets ? JSON.parse(result.secrets) : undefined;
      return {
        id: result.id,
        spec,
        status: result.status,
        lastHeartbeatAt: parseSqlDateToIsoString(result.last_heartbeat_at),
        createdAt: parseSqlDateToIsoString(result.created_at),
        createdBy: result.created_by ?? undefined,
        secrets,
      };
    } catch (error) {
      throw new Error(`Failed to parse spec of task '${taskId}', ${error}`);
    }
  }

  async createTask(
    options: TaskStoreCreateTaskOptions,
  ): Promise<TaskStoreCreateTaskResult> {
    const taskId = uuid();
    await this.db<RawDbTaskRow>('tasks').insert({
      id: taskId,
      spec: JSON.stringify(options.spec),
      secrets: options.secrets ? JSON.stringify(options.secrets) : undefined,
      created_by: options.createdBy ?? null,
      status: 'open',
    });
    return { taskId };
  }

  async claimTask(): Promise<SerializedTask | undefined> {
    return this.db.transaction(async tx => {
      const [task] = await tx<RawDbTaskRow>('tasks')
        .where({
          status: 'open',
        })
        .limit(1)
        .select();

      if (!task) {
        return undefined;
      }

      const updateCount = await tx<RawDbTaskRow>('tasks')
        .where({ id: task.id, status: 'open' })
        .update({
          status: 'processing',
          last_heartbeat_at: this.db.fn.now(),
          // remove the secrets when moving moving to processing state.
          secrets: null,
        });

      if (updateCount < 1) {
        return undefined;
      }

      try {
        const spec = JSON.parse(task.spec);
        const secrets = task.secrets ? JSON.parse(task.secrets) : undefined;
        return {
          id: task.id,
          spec,
          status: 'processing',
          lastHeartbeatAt: task.last_heartbeat_at,
          createdAt: task.created_at,
          createdBy: task.created_by ?? undefined,
          secrets,
        };
      } catch (error) {
        throw new Error(`Failed to parse spec of task '${task.id}', ${error}`);
      }
    });
  }

  async heartbeatTask(taskId: string): Promise<void> {
    const updateCount = await this.db<RawDbTaskRow>('tasks')
      .where({ id: taskId, status: 'processing' })
      .update({
        last_heartbeat_at: this.db.fn.now(),
      });
    if (updateCount === 0) {
      throw new ConflictError(`No running task with taskId ${taskId} found`);
    }
  }

  async listStaleTasks({ timeoutS }: { timeoutS: number }): Promise<{
    tasks: { taskId: string }[];
  }> {
    const rawRows = await this.db<RawDbTaskRow>('tasks')
      .where('status', 'processing')
      .andWhere(
        'last_heartbeat_at',
        '<=',
        this.db.client.config.client.includes('sqlite3')
          ? this.db.raw(`datetime('now', ?)`, [`-${timeoutS} seconds`])
          : this.db.raw(`dateadd('second', ?, ?)`, [
              `-${timeoutS}`,
              this.db.fn.now(),
            ]),
      );
    const tasks = rawRows.map(row => ({
      taskId: row.id,
    }));
    return { tasks };
  }

  async completeTask({
    taskId,
    status,
    eventBody,
  }: {
    taskId: string;
    status: TaskStatus;
    eventBody: JsonObject;
  }): Promise<void> {
    let oldStatus: string;
    if (status === 'failed' || status === 'completed') {
      oldStatus = 'processing';
    } else {
      throw new Error(
        `Invalid status update of run '${taskId}' to status '${status}'`,
      );
    }
    await this.db.transaction(async tx => {
      const [task] = await tx<RawDbTaskRow>('tasks')
        .where({
          id: taskId,
        })
        .limit(1)
        .select();

      if (!task) {
        throw new Error(`No task with taskId ${taskId} found`);
      }
      if (task.status !== oldStatus) {
        throw new ConflictError(
          `Refusing to update status of run '${taskId}' to status '${status}' ` +
            `as it is currently '${task.status}', expected '${oldStatus}'`,
        );
      }
      const updateCount = await tx<RawDbTaskRow>('tasks')
        .where({
          id: taskId,
          status: oldStatus,
        })
        .update({
          status,
        });

      if (updateCount !== 1) {
        throw new ConflictError(
          `Failed to update status to '${status}' for taskId ${taskId}`,
        );
      }

      await tx<RawDbTaskEventRow>('task_events').insert({
        task_id: taskId,
        event_type: 'completion',
        body: JSON.stringify(eventBody),
      });
    });
  }

  async emitLogEvent(
    options: TaskStoreEmitOptions<{ message: string } & JsonObject>,
  ): Promise<void> {
    const { taskId, body } = options;
    const serializedBody = JSON.stringify(body);
    await this.db<RawDbTaskEventRow>('task_events').insert({
      task_id: taskId,
      event_type: 'log',
      body: serializedBody,
    });
  }

  async listEvents({
    taskId,
    after,
  }: TaskStoreListEventsOptions): Promise<{ events: SerializedTaskEvent[] }> {
    const rawEvents = await this.db<RawDbTaskEventRow>('task_events')
      .where({
        task_id: taskId,
      })
      .andWhere(builder => {
        if (typeof after === 'number') {
          builder.where('id', '>', after).orWhere('event_type', 'completion');
        }
      })
      .orderBy('id')
      .select();

    const events = rawEvents.map(event => {
      try {
        const body = JSON.parse(event.body) as JsonObject;
        return {
          id: Number(event.id),
          taskId,
          body,
          type: event.event_type,
          createdAt: parseSqlDateToIsoString(event.created_at),
        };
      } catch (error) {
        throw new Error(
          `Failed to parse event body from event taskId=${taskId} id=${event.id}, ${error}`,
        );
      }
    });
    return { events };
  }
}
