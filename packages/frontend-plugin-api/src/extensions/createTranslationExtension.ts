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

import { TranslationMessages, TranslationResource } from '../translation';
import { createExtension, createExtensionDataRef } from '../wiring';

/** @public */
export function createTranslationExtension(options: {
  name?: string;
  resource: TranslationResource | TranslationMessages;
}) {
  return createExtension({
    kind: 'translation',
    namespace: options.resource.id,
    name: options.name,
    attachTo: { id: 'core', input: 'translations' },
    output: {
      resource: createTranslationExtension.translationDataRef,
    },
    factory: () => ({ resource: options.resource }),
  });
}

/** @public */
export namespace createTranslationExtension {
  export const translationDataRef = createExtensionDataRef<
    TranslationResource | TranslationMessages
  >('core.translation.translation');
}
