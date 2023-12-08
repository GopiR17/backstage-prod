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

import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { AzureDevOpsAnnotatorProcessor } from '@backstage/plugin-azure-devops-backend';

/**
 * Azure DevOps Annotator Processor Module
 *
 * @public
 */
export const azureDevOpsAnnotatorProcessorModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'azure-devops-annotator-processor-module',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ catalog, config }) {
        catalog.addProcessor(AzureDevOpsAnnotatorProcessor.fromConfig(config));
      },
    });
  },
});
