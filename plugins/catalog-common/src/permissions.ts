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

import { Permission } from '@backstage/plugin-permission-common';

export const RESOURCE_TYPE_CATALOG_ENTITY = 'catalog-entity';
export const RESOURCE_TYPE_CATALOG_LOCATION = 'catalog-location';

export const catalogEntityReadPermission: Permission = {
  name: 'catalog.entity.read',
  attributes: {
    action: 'read',
  },
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
};

export const catalogEntityUnregisterPermission: Permission = {
  name: 'catalog.entity.unregister',
  attributes: {
    action: 'delete',
  },
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
};

export const catalogEntityRefreshPermission: Permission = {
  name: 'catalog.entity.refresh',
  attributes: {},
  resourceType: RESOURCE_TYPE_CATALOG_ENTITY,
};

export const catalogLocationReadPermission: Permission = {
  name: 'catalog.location.read',
  attributes: {
    action: 'read',
  },
  resourceType: RESOURCE_TYPE_CATALOG_LOCATION,
};

export const catalogLocationCreatePermission: Permission = {
  name: 'catalog.location.create',
  attributes: {
    action: 'create',
  },
  resourceType: RESOURCE_TYPE_CATALOG_LOCATION,
};

export const catalogLocationDeletePermission: Permission = {
  name: 'catalog.location.delete',
  attributes: {
    action: 'delete',
  },
  resourceType: RESOURCE_TYPE_CATALOG_LOCATION,
};
