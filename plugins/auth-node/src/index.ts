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

/**
 * Common functionality and types for the Backstage auth plugin.
 *
 * @packageDocumentation
 */

export { getBearerTokenFromAuthorizationHeader } from './getBearerTokenFromAuthorizationHeader';
export { DefaultIdentityClient } from './DefaultIdentityClient';
export { IdentityClient } from './IdentityClient';
export type { IdentityApi } from './IdentityApi';
export type { IdentityClientOptions } from './DefaultIdentityClient';
export type {
  BackstageIdentityResponse,
  BackstageSignInResult,
  BackstageUserIdentity,
  IdentityApiGetIdentityRequest,
} from './types';
export * from './identity/types';
export * from './providers/types';
export * from './lib/oauth/types';
