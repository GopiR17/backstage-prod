/*
 * Copyright 2021 The Backstage Authors
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

import { Extension, attachComponentData } from '@backstage/core-plugin-api';
import React from 'react';
import { FIELD_EXTENSION_KEY, FIELD_EXTENSION_WRAPPER_KEY } from './keys';
import {
  CustomFieldExtensionSchema,
  CustomFieldValidator,
  FieldExtensionComponentProps,
  FieldExtensionOptions,
} from './types';

/**
 * The type used to wrap up the Layout and embed the input props
 *
 * @public
 */
export type FieldExtensionComponent<_TReturnValue, _TInputProps> = () => null;

/**
 * Method for creating field extensions that can be used in the scaffolder
 * frontend form.
 * @public
 */
export function createScaffolderFieldExtension<
  TReturnValue = unknown,
  TInputProps = unknown,
>(
  options: FieldExtensionOptions<TReturnValue, TInputProps>,
): Extension<FieldExtensionComponent<TReturnValue, TInputProps>> {
  return {
    expose() {
      const FieldExtensionDataHolder: any = () => null;

      attachComponentData(
        FieldExtensionDataHolder,
        FIELD_EXTENSION_KEY,
        options,
      );

      return FieldExtensionDataHolder;
    },
  };
}

/**
 * The Wrapping component for defining fields extensions inside
 *
 * @public
 */
export const ScaffolderFieldExtensions: (
  props: React.PropsWithChildren<{}>,
) => JSX.Element | null = (): JSX.Element | null => null;

attachComponentData(
  ScaffolderFieldExtensions,
  FIELD_EXTENSION_WRAPPER_KEY,
  true,
);

export type {
  CustomFieldExtensionSchema,
  CustomFieldValidator,
  FieldExtensionComponentProps,
  FieldExtensionOptions,
};
