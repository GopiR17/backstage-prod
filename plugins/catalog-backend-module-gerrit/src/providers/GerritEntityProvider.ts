/*
 * Copyright 2022 The Backstage Authors
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

import { TaskRunner } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import {
  EntityProvider,
  EntityProviderConnection,
  LocationSpec,
  locationSpecToLocationEntity,
} from '@backstage/plugin-catalog-backend';
import fetch, { Response } from 'node-fetch';
import {
  GerritIntegration,
  getGerritProjectsApiUrl,
  getGerritRequestOptions,
  parseGerritJsonResponse,
  ScmIntegrations,
} from '@backstage/integration';
import * as uuid from 'uuid';
import { Logger } from 'winston';

import { readGerritConfigs } from './config';
import { GerritProjectQueryResult, GerritProviderConfig } from './types';

/** @public */
export class GerritEntityProvider implements EntityProvider {
  private readonly config: GerritProviderConfig;
  private readonly integration: GerritIntegration;
  private readonly logger: Logger;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  static fromConfig(
    configRoot: Config,
    options: {
      logger: Logger;
      schedule: TaskRunner;
    },
  ): GerritEntityProvider[] {
    const providerConfigs = readGerritConfigs(configRoot);
    const integrations = ScmIntegrations.fromConfig(configRoot).gerrit;
    const providers: GerritEntityProvider[] = [];

    providerConfigs.forEach(providerConfig => {
      const integration = integrations.byHost(providerConfig.host);
      if (!integration) {
        throw new InputError(
          `No gerrit integration found that matches host ${providerConfig.host}`,
        );
      }
      providers.push(
        new GerritEntityProvider(
          providerConfig,
          integration,
          options.logger,
          options.schedule,
        ),
      );
    });
    return providers;
  }

  private constructor(
    config: GerritProviderConfig,
    integration: GerritIntegration,
    logger: Logger,
    schedule: TaskRunner,
  ) {
    this.config = config;
    this.integration = integration;
    this.logger = logger.child({
      target: this.getProviderName(),
    });
    this.scheduleFn = this.createScheduleFn(schedule);
  }

  /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.getProviderName} */
  getProviderName(): string {
    return `gerrit-provider:${this.config.id}`;
  }

  /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.getTaskId} */
  getTaskId(): string {
    return `${this.getProviderName()}:refresh`;
  }

  /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.connect} */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  private createScheduleFn(schedule: TaskRunner): () => Promise<void> {
    return async () => {
      const taskId = this.getTaskId();
      return schedule.run({
        id: taskId,
        fn: async () => {
          const logger = this.logger.child({
            class: GerritEntityProvider.prototype.constructor.name,
            taskId,
            taskInstanceId: uuid.v4(),
          });

          try {
            await this.refresh(logger);
          } catch (error) {
            logger.error(error);
          }
        },
      });
    };
  }

  async refresh(logger: Logger): Promise<void> {
    if (!this.connection) {
      throw new Error('Gerrit discovery connection not initialized');
    }

    let response: Response;

    const baseProjectApiUrl = getGerritProjectsApiUrl(this.integration.config);
    const projectQueryUrl = `${baseProjectApiUrl}?${this.config.query}`;
    try {
      response = await fetch(projectQueryUrl, {
        method: 'GET',
        ...getGerritRequestOptions(this.integration.config),
      });
    } catch (e) {
      throw new Error(
        `Failed to list Gerrit projects for query ${this.config.query}, ${e}`,
      );
    }
    const gerritProjectsResponse = (await parseGerritJsonResponse(
      response as any,
    )) as GerritProjectQueryResult;
    const projects = Object.keys(gerritProjectsResponse);

    const locations = projects.map(project => this.createLocationSpec(project));
    await this.connection.applyMutation({
      type: 'full',
      entities: locations.map(location => ({
        locationKey: this.getProviderName(),
        entity: locationSpecToLocationEntity({ location }),
      })),
    });
    logger.info(`Found ${locations.length} locations.`);
  }

  private createLocationSpec(project: string): LocationSpec {
    return {
      type: 'url',
      target: `${this.integration.config.gitilesBaseUrl}/${project}/+/refs/heads/${this.config.branch}/catalog-info.yaml`,
      presence: 'optional',
    };
  }
}
