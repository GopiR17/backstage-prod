/*
 * Copyright 2022 The Backstage Authors
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

import {
  QueryEntitiesCursorRequest,
  QueryEntitiesInitialRequest,
  QueryEntitiesRequest,
} from '../../catalog/types';
import { parseIntegerParam, parseStringParam } from './common';
import { parseEntityFilterParams } from './parseEntityFilterParams';
import { parseEntitySortFieldParams } from './parseEntitySortFieldParams';
import { parseEntityTransformParams } from './parseEntityTransformParams';

export function parseQueryEntitiesParams(
  params: Record<string, unknown>,
): Omit<QueryEntitiesRequest, 'authorizationToken'> {
  const fields = parseEntityTransformParams(params);
  const limit = parseIntegerParam(params.limit, 'limit');
  const cursor = parseStringParam(params.cursor, 'cursor');
  if (cursor) {
    const response: Omit<QueryEntitiesCursorRequest, 'authorizationToken'> = {
      cursor,
      fields,
      limit,
    };
    return response;
  }

  const filter = parseEntityFilterParams(params);
  const query = parseStringParam(params.query, 'query');
  const sortFields = parseEntitySortFieldParams(params);

  const response: Omit<QueryEntitiesInitialRequest, 'authorizationToken'> = {
    fields,
    filter,
    limit,
    sortFields,
    query,
  };

  return response;
}
