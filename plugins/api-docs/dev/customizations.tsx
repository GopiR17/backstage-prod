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

import React from 'react';
import { Chip } from '@material-ui/core';
import {
  defaultColumns,
  defaultFilters,
} from '../src/components/ApiExplorerTable/presets';
import { Table, TableFilter } from '@backstage/core';
import {
  Columns,
  Filters,
  EntityRow,
} from '../src/components/ApiExplorerTable/types';

const domainColumn = { title: 'Domain', field: 'entity.metadata.domain' };
const capabilitiesColumn = {
  title: 'Capabilities',
  field: 'entity.metadata.capabilities',
  cellStyle: {
    padding: '0px 16px 0px 20px',
  },
  render: ({ entity }: EntityRow) => (
    <>
      {entity.metadata.capabilities &&
        (entity.metadata.capabilities as string[]).map(t => (
          <Chip
            key={t}
            label={t}
            size="small"
            variant="outlined"
            style={{ marginBottom: '0px' }}
          />
        ))}
    </>
  ),
};

const getColumns = (): Columns => {
  const { name, description, owner, lifecycle, type } = defaultColumns;
  const customColumns = {
    name,
    description,
    owner,
    lifecycle,
    type,
    domain: domainColumn,
    capabilities: capabilitiesColumn,
  };

  return customColumns;
};

const getFilters = (): Filters => {
  const { owner, type, lifecycle } = defaultFilters;
  const customFilters = {
    owner,
    type,
    lifecycle,
    domain: { column: 'Domain', type: 'select' } as TableFilter,
  };

  return customFilters;
};

const customColumns = getColumns();
const customFilters = getFilters();

export const CustomTable = (props: any) => {
  const {
    isLoading = false,
    data,
    options: defaultOptions,
    initialState,
    onStateChange,
  } = props;
  const {
    columns,
    filters,
    options = {},
  } = CustomTable;

  return (
    <Table<EntityRow>
      isLoading={isLoading}
      columns={columns}
      filters={filters}
      options={{ ...defaultOptions, ...options }}
      data={data}
      initialState={initialState}
      onStateChange={onStateChange}
    />
  );
};

CustomTable.options = { paging: true };
CustomTable.columns = Object.values(customColumns);
CustomTable.filters = Object.values(customFilters);
