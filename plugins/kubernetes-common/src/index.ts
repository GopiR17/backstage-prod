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
 * Common functionalities for Kubernetes, to be shared between the `kubernetes` and `kubernetes-backend` plugins
 *
 * @packageDocumentation
 */

export * from './types';
export * from './catalog-entity-constants';
export {
  kubernetesProxyPermission,
  kubernetesPermissions,
} from './permissions';
export * from './api';
export * from './error-detection';
export * from './kubernetes-auth-provider';
export * from './util';
