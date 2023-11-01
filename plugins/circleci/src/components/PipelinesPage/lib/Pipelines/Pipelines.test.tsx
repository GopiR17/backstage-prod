/*
 * Copyright 2020 The Backstage Authors
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
import { Pipelines } from './Pipelines';
import { renderInTestApp } from '@backstage/test-utils';

jest.mock('../CITable', () => ({
  CITable: () => '<CITable />',
}));

jest.mock('../../../../hooks/usePipelines', () => ({
  usePipelines: jest.fn().mockReturnValue([{ loading: false, value: [] }, {}]),
}));

describe('Pipelines', () => {
  it('should display pipelines', async () => {
    const rendered = await renderInTestApp(<Pipelines />);

    expect(rendered.getByText('<CITable />')).toBeInTheDocument();
  });
});
