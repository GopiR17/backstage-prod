/*
 * Copyright 2023 The Backstage Authors
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

import { JsonValue } from '@backstage/types';
import { Writable } from 'stream';

/** @public */
export type TemplateFilter = (...args: JsonValue[]) => JsonValue | undefined;

/** @public */
export type TemplateGlobal =
  | ((...args: JsonValue[]) => JsonValue | undefined)
  | JsonValue;

/**
 * Handles the running of containers, on behalf of others.
 *
 * @public
 */
export interface ContainerRunner {
  /**
   * Runs a container image to completion.
   */
  runContainer(opts: {
    imageName: string;
    command?: string | string[];
    args: string[];
    logStream?: Writable;
    mountDirs?: Record<string, string>;
    workingDir?: string;
    envVars?: Record<string, string>;
  }): Promise<void>;
}
