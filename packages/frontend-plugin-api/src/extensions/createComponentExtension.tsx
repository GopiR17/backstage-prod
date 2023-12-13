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

import React, { lazy, ComponentType } from 'react';
import {
  AnyExtensionInputMap,
  ResolvedExtensionInputs,
  createExtension,
  createExtensionDataRef,
} from '../wiring';
import { Expand } from '../types';
import { PortableSchema } from '../schema';
import { ExtensionBoundary, ComponentRef } from '../components';

/** @public */
export function createComponentExtension<
  TProps extends {},
  TConfig extends {},
  TInputs extends AnyExtensionInputMap,
>(options: {
  ref: ComponentRef<TProps>;
  name?: string;
  disabled?: boolean;
  inputs?: TInputs;
  configSchema?: PortableSchema<TConfig>;
  component:
    | {
        lazy: (values: {
          config: TConfig;
          inputs: Expand<ResolvedExtensionInputs<TInputs>>;
        }) => Promise<ComponentType<TProps>>;
      }
    | {
        sync: (values: {
          config: TConfig;
          inputs: Expand<ResolvedExtensionInputs<TInputs>>;
        }) => ComponentType<TProps>;
      };
}) {
  return createExtension({
    kind: 'component',
    namespace: options.ref.id,
    name: options.name,
    attachTo: { id: 'core', input: 'components' },
    inputs: options.inputs,
    disabled: options.disabled,
    configSchema: options.configSchema,
    output: {
      component: createComponentExtension.componentDataRef,
    },
    factory({ config, inputs, node }) {
      let ExtensionComponent: ComponentType<TProps>;

      if ('sync' in options.component) {
        ExtensionComponent = options.component.sync({ config, inputs });
      } else {
        const lazyLoader = options.component.lazy;
        ExtensionComponent = lazy(() =>
          lazyLoader({ config, inputs }).then(component => ({
            default: component,
          })),
        ) as unknown as ComponentType<TProps>;
      }

      return {
        component: {
          ref: options.ref,
          impl: props => (
            <ExtensionBoundary node={node}>
              <ExtensionComponent {...(props as TProps)} />
            </ExtensionBoundary>
          ),
        },
      };
    },
  });
}

/** @public */
export namespace createComponentExtension {
  export const componentDataRef = createExtensionDataRef<{
    ref: ComponentRef;
    impl: ComponentType;
  }>('core.component.component');
}
