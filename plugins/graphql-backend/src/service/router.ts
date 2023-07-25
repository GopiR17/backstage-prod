/*
 * Copyright 2020 The Backstage Authors
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

import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Module } from 'graphql-modules';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import {
  createGraphQLApp,
  createLoader,
  EnvelopPlugins,
} from '@backstage/plugin-catalog-graphql';
import { Config } from '@backstage/config';
import helmet from 'helmet';
import { CatalogClient } from '@backstage/catalog-client';

/** @public */
export interface RouterOptions {
  logger: Logger;
  config: Config;
  catalog: CatalogClient;
  modules?: Module[];
  plugins?: EnvelopPlugins;
}

/** @public */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { application } = createGraphQLApp({
    modules: options.modules,
    loader: () => createLoader(options.catalog),
    plugins: options.plugins,
  });
  const { createApolloExecutor, schema } = application;

  const server = new ApolloServer({
    schema,
    executor: createApolloExecutor(),
    logger: options.logger,
    introspection: true,
  });

  await server.start();

  const router = Router();

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV === 'development')
    router.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'", "'unsafe-inline'", 'http://*'],
        },
      }),
    );

  router.use(expressMiddleware(server));
  router.use(errorHandler());

  return router;
}
