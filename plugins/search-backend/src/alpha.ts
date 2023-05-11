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

import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  RegisterCollatorParameters,
  RegisterDecoratorParameters,
  LunrSearchEngine,
} from '@backstage/plugin-search-backend-node';
import {
  searchIndexServiceRef,
  searchIndexRegistryExtensionPoint,
  SearchIndexRegistryExtensionPoint,
  SearchEngineRegistryExtensionPoint,
  searchEngineRegistryExtensionPoint,
} from '@backstage/plugin-search-backend-node/alpha';

import { createRouter } from './service/router';
import { SearchEngine } from '@backstage/plugin-search-common';

class SearchIndexRegistry implements SearchIndexRegistryExtensionPoint {
  private collators: RegisterCollatorParameters[] = [];
  private decorators: RegisterDecoratorParameters[] = [];

  public addCollator(options: RegisterCollatorParameters): void {
    this.collators.push(options);
  }

  public addDecorator(options: RegisterDecoratorParameters): void {
    this.decorators.push(options);
  }

  public getCollators(): RegisterCollatorParameters[] {
    return this.collators;
  }

  public getDecorators(): RegisterDecoratorParameters[] {
    return this.decorators;
  }
}

class SearchEngineRegistry implements SearchEngineRegistryExtensionPoint {
  private searchEngine: SearchEngine | null = null;

  public setSearchEngine(searchEngine: SearchEngine): void {
    if (this.searchEngine) {
      throw new Error('Multiple Search engines is not supported at this time');
    }
    this.searchEngine = searchEngine;
  }

  public getSearchEngine(): SearchEngine | null {
    return this.searchEngine;
  }
}

/**
 * The Search plugin is responsible for starting search indexing processes and return search results.
 * @alpha
 */
export const searchPlugin = createBackendPlugin({
  pluginId: 'search',
  register(env) {
    const searchIndexRegistry = new SearchIndexRegistry();
    env.registerExtensionPoint(
      searchIndexRegistryExtensionPoint,
      searchIndexRegistry,
    );

    const searchEngineRegistry = new SearchEngineRegistry();
    env.registerExtensionPoint(
      searchEngineRegistryExtensionPoint,
      searchEngineRegistry,
    );

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.config,
        permissions: coreServices.permissions,
        http: coreServices.httpRouter,
        searchIndexService: searchIndexServiceRef,
      },
      async init({ config, logger, permissions, http, searchIndexService }) {
        let searchEngine = searchEngineRegistry.getSearchEngine();
        if (!searchEngine) {
          searchEngine = new LunrSearchEngine({
            logger: loggerToWinstonLogger(logger),
          });
        }

        const collators = searchIndexRegistry.getCollators();
        const decorators = searchIndexRegistry.getDecorators();

        await searchIndexService.start({
          searchEngine,
          collators,
          decorators,
        });

        const router = await createRouter({
          config,
          permissions,
          logger: loggerToWinstonLogger(logger),
          engine: searchEngine,
          types: searchIndexService.getDocumentTypes(),
        });

        http.use(router);
      },
    });
  },
});
