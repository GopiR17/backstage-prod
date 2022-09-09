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

import {
  createServiceFactory,
  httpRouterServiceRef,
  configServiceRef,
  pluginMetadataServiceRef,
} from '@backstage/backend-plugin-api';
import Router from 'express-promise-router';
import { Handler } from 'express';
import { createServiceBuilder } from '@backstage/backend-common';

/** @public */
export const httpRouterFactory = createServiceFactory({
  service: httpRouterServiceRef,
  deps: {
    config: configServiceRef,
    plugin: pluginMetadataServiceRef,
  },
  async factory({ config }) {
    const rootRouter = Router();

    const service = createServiceBuilder(module)
      .loadConfig(config)
      .addRouter('', rootRouter);

    await service.start();

    return async ({ plugin }) => {
      const pluginId = plugin.getId();
      const path = pluginId ? `/api/${pluginId}` : '';
      return {
        use(handler: Handler) {
          rootRouter.use(path, handler);
        },
      };
    };
  },
});
