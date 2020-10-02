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

import qs from 'qs';
import { QueryParams } from '../filter/types';

export const stringify = (queryParams: Partial<QueryParams>) =>
  qs.stringify(queryParams, { strictNullHandling: true });
export const parse = (queryString: string): Partial<QueryParams> =>
  qs.parse(queryString, { ignoreQueryPrefix: true, strictNullHandling: true });
