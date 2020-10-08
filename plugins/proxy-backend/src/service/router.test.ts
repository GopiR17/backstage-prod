/*
 * Copyright 2020 Spotify AB
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

import { buildMiddleware, createRouter } from './router';
import * as winston from 'winston';
import { ConfigReader } from '@backstage/config';
import {
  loadBackendConfig,
  SingleHostDiscovery,
} from '@backstage/backend-common';
import {
  createProxyMiddleware,
  Options as ProxyMiddlewareOptions,
  RequestHandler,
} from 'http-proxy-middleware';
import * as express from 'express';
import * as http from 'http';

jest.mock('http-proxy-middleware', () => {
  return {
    createProxyMiddleware: jest.fn().mockImplementation(
      (): RequestHandler => {
        return () => undefined;
      },
    ),
  };
});

const mockCreateProxyMiddleware = createProxyMiddleware as jest.MockedFunction<
  typeof createProxyMiddleware
>;

describe('createRouter', () => {
  it('works', async () => {
    const logger = winston.createLogger();
    const config = ConfigReader.fromConfigs(await loadBackendConfig());
    const discovery = SingleHostDiscovery.fromConfig(config);
    const router = await createRouter({
      config,
      logger,
      discovery,
    });
    expect(router).toBeDefined();
  });
});

describe('buildMiddleware', () => {
  const logger = winston.createLogger();

  beforeEach(() => {
    mockCreateProxyMiddleware.mockClear();
  });

  it('accepts strings', async () => {
    buildMiddleware('/api/', logger, 'test', 'http://mocked');

    expect(createProxyMiddleware).toHaveBeenCalledTimes(1);

    const [filter, fullConfig] = mockCreateProxyMiddleware.mock.calls[0] as [
      (pathname: string, req: Partial<express.Request>) => boolean,
      ProxyMiddlewareOptions,
    ];
    expect(filter('', { method: 'GET' })).toBe(true);
    expect(filter('', { method: 'POST' })).toBe(true);
    expect(filter('', { method: 'PUT' })).toBe(true);
    expect(filter('', { method: 'PATCH' })).toBe(true);
    expect(filter('', { method: 'DELETE' })).toBe(true);

    expect(fullConfig.pathRewrite).toEqual({ '^/api/test/': '/' });
    expect(fullConfig.changeOrigin).toBe(true);
    expect(fullConfig.logProvider!(logger)).toBe(logger);
  });

  it('limits allowedMethods', async () => {
    buildMiddleware('/api/', logger, 'test', {
      target: 'http://mocked',
      allowedMethods: ['GET', 'DELETE'],
    });

    expect(createProxyMiddleware).toHaveBeenCalledTimes(1);

    const [filter, fullConfig] = mockCreateProxyMiddleware.mock.calls[0] as [
      (pathname: string, req: Partial<express.Request>) => boolean,
      ProxyMiddlewareOptions,
    ];
    expect(filter('', { method: 'GET' })).toBe(true);
    expect(filter('', { method: 'POST' })).toBe(false);
    expect(filter('', { method: 'PUT' })).toBe(false);
    expect(filter('', { method: 'PATCH' })).toBe(false);
    expect(filter('', { method: 'DELETE' })).toBe(true);

    expect(fullConfig.pathRewrite).toEqual({ '^/api/test/': '/' });
    expect(fullConfig.changeOrigin).toBe(true);
    expect(fullConfig.logProvider!(logger)).toBe(logger);
  });

  it('permits default headers', async () => {
    buildMiddleware('/api/', logger, 'test', {
      target: 'http://mocked',
    });

    expect(createProxyMiddleware).toHaveBeenCalledTimes(1);

    const config = mockCreateProxyMiddleware.mock
      .calls[0][1] as ProxyMiddlewareOptions;

    const testClientRequest = {
      getHeaderNames: () => [
        'cache-control',
        'content-language',
        'content-length',
        'content-type',
        'expires',
        'last-modified',
        'pragma',
        'host',
        'accept',
        'accept-language',
        'user-agent',
        'cookie',
      ],
      removeHeader: jest.fn(),
    } as Partial<http.ClientRequest>;

    expect(config).toBeDefined();
    expect(config.onProxyReq).toBeDefined();

    config.onProxyReq!(
      testClientRequest as http.ClientRequest,
      {} as express.Request,
      {} as express.Response,
    );

    expect(testClientRequest.removeHeader).toHaveBeenCalledTimes(1);
    expect(testClientRequest.removeHeader).toHaveBeenCalledWith('cookie');
  });

  it('permits default and configured headers', async () => {
    buildMiddleware('/api/', logger, 'test', {
      target: 'http://mocked',
      headers: {
        Authorization: 'my-token',
      },
    });

    expect(createProxyMiddleware).toHaveBeenCalledTimes(1);

    const config = mockCreateProxyMiddleware.mock
      .calls[0][1] as ProxyMiddlewareOptions;

    const testClientRequest = {
      getHeaderNames: () => ['authorization', 'Cookie'],
      removeHeader: jest.fn(),
    } as Partial<http.ClientRequest>;

    config.onProxyReq!(
      testClientRequest as http.ClientRequest,
      {} as express.Request,
      {} as express.Response,
    );

    expect(testClientRequest.removeHeader).toHaveBeenCalledTimes(1);
    expect(testClientRequest.removeHeader).toHaveBeenCalledWith('Cookie');
  });

  it('permits configured headers', async () => {
    buildMiddleware('/api/', logger, 'test', {
      target: 'http://mocked',
      allowedHeaders: ['authorization', 'cookie'],
    });

    expect(createProxyMiddleware).toHaveBeenCalledTimes(1);

    const config = mockCreateProxyMiddleware.mock
      .calls[0][1] as ProxyMiddlewareOptions;

    const testClientRequest = {
      getHeaderNames: () => ['authorization', 'Cookie', 'X-Auth-Request-User'],
      removeHeader: jest.fn(),
    } as Partial<http.ClientRequest>;

    config.onProxyReq!(
      testClientRequest as http.ClientRequest,
      {} as express.Request,
      {} as express.Response,
    );

    expect(testClientRequest.removeHeader).toHaveBeenCalledTimes(1);
    expect(testClientRequest.removeHeader).toHaveBeenCalledWith(
      'X-Auth-Request-User',
    );
  });
});
