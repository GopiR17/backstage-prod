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

// @ts-check

/** @type {import('@manypkg/get-packages')} */
const manypkg = require('@manypkg/get-packages');

/**
 * @typedef ExtendedPackage
 * @type {import('@manypkg/get-packages').Package & { packageJson: { exports?: Record<string, string> }}} packageJson
 */

/**
 * @typedef PackageMap
 * @type object
 *
 * @property {ExtendedPackage} root
 * @property {ExtendedPackage[]} list
 * @property {Map<string, ExtendedPackage>} map
 */

// Loads all packages in the monorepo once, and caches the result
module.exports = (function () {
  let result = undefined;
  let lastLoadAt = undefined;

  /** @returns {PackageMap | undefined} */
  return function getPackages(/** @type {string} */ dir) {
    if (result) {
      // Only cache for 5 seconds, to avoid the need to reload ESLint servers
      if (Date.now() - lastLoadAt > 5000) {
        result = undefined;
      } else {
        return result;
      }
    }
    const packages = manypkg.getPackagesSync(dir);
    if (!packages) {
      return undefined;
    }
    result = {
      map: new Map(packages.packages.map(pkg => [pkg.packageJson.name, pkg])),
      list: packages.packages,
      root: packages.root,
    };
    lastLoadAt = Date.now();
    return result;
  };
})();
