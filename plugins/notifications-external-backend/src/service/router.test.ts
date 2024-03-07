/*
 * Copyright 2024 The Backstage Authors
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
import express from 'express';
import request from 'supertest';

import { getVoidLogger } from '@backstage/backend-common';
import { DefaultNotificationService } from '@backstage/plugin-notifications-node';
import { MockConfigApi } from '@backstage/test-utils';
import { mockServices } from '@backstage/backend-test-utils';

import { createRouter } from './router';

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const discovery = mockServices.discovery();
    const auth = mockServices.auth();
    const logger = getVoidLogger();
    const config = new MockConfigApi({});
    const notificationService = DefaultNotificationService.create({
      auth,
      discovery,
    });

    const router = await createRouter({
      config,
      logger,
      notificationService,
    });

    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
