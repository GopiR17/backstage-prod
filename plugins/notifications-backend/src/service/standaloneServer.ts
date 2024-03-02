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
  createLegacyAuthAdapters,
  createServiceBuilder,
  HostDiscovery,
  loadBackendConfig,
  PluginDatabaseManager,
  ServerTokenManager,
} from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createRouter } from './router';
import Knex from 'knex';
import { IdentityApi } from '@backstage/plugin-auth-node';
import { Request } from 'express';
import {
  CatalogApi,
  CatalogRequestOptions,
  GetEntitiesByRefsRequest,
} from '@backstage/catalog-client';
import { DefaultSignalService } from '@backstage/plugin-signals-node';
import {
  EventParams,
  EventsService,
  EventsServiceSubscribeOptions,
} from '@backstage/plugin-events-node';
import {
  AuthService,
  HttpAuthService,
  UserInfoService,
} from '@backstage/backend-plugin-api';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: Logger;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'notifications-backend' });
  logger.debug('Starting application server...');

  const config = await loadBackendConfig({ logger, argv: process.argv });
  const db = Knex(config.get('backend.database'));

  const tokenManager = ServerTokenManager.fromConfig(config, {
    logger,
  });
  const discovery = HostDiscovery.fromConfig(config);

  const dbMock: PluginDatabaseManager = {
    async getClient() {
      return db;
    },
  };

  const catalogApi = {
    async getEntitiesByRefs(
      _request: GetEntitiesByRefsRequest,
      __options?: CatalogRequestOptions,
    ) {
      return {
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'User',
            metadata: { name: 'user', namespace: 'default' },
            spec: {},
          },
        ],
      };
    },
  } as Partial<CatalogApi> as CatalogApi;

  const identityMock: IdentityApi = {
    async getIdentity({ request }: { request: Request<unknown> }) {
      const token = request.headers.authorization?.split(' ')[1];
      return {
        identity: {
          type: 'user',
          ownershipEntityRefs: [],
          userEntityRef: 'user:default/guest',
        },
        token: token || 'no-token',
      };
    },
  };

  const mockSubscribers: EventsServiceSubscribeOptions[] = [];
  const events: EventsService = {
    async publish(params: EventParams): Promise<void> {
      mockSubscribers.forEach(sub => sub.onEvent(params));
    },
    async subscribe(subscription: EventsServiceSubscribeOptions) {
      mockSubscribers.push(subscription);
    },
  };

  const signalService = DefaultSignalService.create({ events });
  // TODO: Move to use services instead this hack
  const { auth, httpAuth, userInfo } = createLegacyAuthAdapters<
    any,
    { auth: AuthService; httpAuth: HttpAuthService; userInfo: UserInfoService }
  >({
    identity: identityMock,
    tokenManager,
    discovery,
  });

  const router = await createRouter({
    logger,
    database: dbMock,
    catalog: catalogApi,
    discovery,
    signalService,
    auth,
    httpAuth,
    userInfo,
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/notifications', router);
  if (options.enableCors) {
    service = service.enableCors({ origin: 'http://localhost:3000' });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
