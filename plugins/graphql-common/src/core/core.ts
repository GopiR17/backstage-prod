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
import { resolvePackagePath } from '@backstage/backend-common';
import { loadFilesSync } from '@graphql-tools/load-files';
import { createModule } from 'graphql-modules';
import { createDirectiveMapperProvider } from '../mapperProvider';
import { ResolverContext } from '../types';
import { fieldDirectiveMapper } from './fieldDirectiveMapper';

/** @public */
export const Core = createModule({
  id: 'core',
  typeDefs: loadFilesSync(
    resolvePackagePath(
      '@backstage/plugin-graphql-common',
      'src/core/core.graphql',
    ),
  ),
  resolvers: {
    Node: {
      id: async (
        { id }: { id: string },
        _: never,
        { loader }: ResolverContext,
      ): Promise<string | null> => {
        const node = await loader.load(id);
        if (!node) return null;
        return id;
      },
    },
    Query: {
      node: (_: any, { id }: { id: string }): { id: string } => ({ id }),
    },
  },
  providers: [createDirectiveMapperProvider('field', fieldDirectiveMapper)],
});
