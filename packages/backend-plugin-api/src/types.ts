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

/** @internal */
export interface BackendFeatureFactory<
  TOptions extends [options?: object] = [],
> {
  (...options: TOptions): BackendFeature;
  $$type: '@backstage/BackendFeatureFactory';
}

/** @public */
export interface BackendFeature {
  // NOTE: This type is opaque in order to simplify future API evolution.
  $$type: '@backstage/BackendFeature';
}

/** @public */
export type BackendFeatureRegistration =
  | BackendPluginRegistration
  | BackendModuleRegistration;

/** @public */
export interface BackendPluginRegistration {
  pluginId: string;
  type: 'plugin';
}

/** @public */
export interface BackendModuleRegistration {
  pluginId: string;
  moduleId: string;
  type: 'module';
}

/**
 * The BackendFeatureListener is an abstract class that a service
 * would extend, so that it can be fed with the list of registered features during
 * application initialization.
 *
 * @public
 */
export abstract class BackendFeatureRegistrationObserver {
  abstract setFeatures(features: BackendFeatureRegistration[]): void;
}
