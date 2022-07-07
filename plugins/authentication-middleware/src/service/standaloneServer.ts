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

import { createServiceBuilder } from '@backstage/backend-common';
import { Server } from 'http';
import { Logger } from 'winston';
import { createMiddleware } from './middleware';

export interface ServerOptions {
  logger: Logger;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'auth-backend' });

  logger.debug('Starting application server...');
  const middleware = await createMiddleware({
    logger,
  });

  const service = createServiceBuilder(module)
    .enableCors({ origin: 'http://localhost:3000', credentials: true })
    .addRouter('/auth', middleware);

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}
