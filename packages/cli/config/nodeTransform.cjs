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

const { transformSync } = require('@swc/core');
const { addHook } = require('pirates');

addHook(
  (code, filename) => {
    const transformed = transformSync(code, {
      filename,
      // sourceMaps: 'inline',
      module: { type: 'commonjs', ignoreDynamic: true },
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          dynamicImport: true,
        },
      },
    });
    if (filename.includes('backend')) {
      console.log(transformed.code);
    }
    process.send?.({ type: 'watch', path: filename });
    return transformed.code;
  },
  { extensions: ['.ts', '.cts'], ignoreNodeModules: true },
);

addHook(
  (code, filename) => {
    process.send?.({ type: 'watch', path: filename });
    return code;
  },
  { extensions: ['.js', '.cjs'], ignoreNodeModules: true },
);
