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

import { ConfigReader } from '@backstage/config';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  MockStarredEntitiesApi,
  catalogApiRef,
  entityRouteRef,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import { HomePageCalendar } from '@backstage/plugin-gcalendar';
import {
  CustomHomepageGrid,
  HomePageRandomJoke,
  HomePageStarredEntities,
} from '@backstage/plugin-home';
import { MicrosoftCalendarCard } from '@backstage/plugin-microsoft-calendar';
import { HomePageSearchBar, searchPlugin } from '@backstage/plugin-search';
import { searchApiRef } from '@backstage/plugin-search-react';
import { TestApiProvider, wrapInTestApp } from '@backstage/test-utils';
import React from 'react';

const entities = [
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'mock-starred-entity',
      title: 'Mock Starred Entity!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'mock-starred-entity-2',
      title: 'Mock Starred Entity 2!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'mock-starred-entity-3',
      title: 'Mock Starred Entity 3!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'mock-starred-entity-4',
      title: 'Mock Starred Entity 4!',
    },
  },
];

const mockCatalogApi = {
  getEntities: async () => ({ items: entities }),
};

const starredEntitiesApi = new MockStarredEntitiesApi();
starredEntitiesApi.toggleStarred('component:default/example-starred-entity');
starredEntitiesApi.toggleStarred('component:default/example-starred-entity-2');
starredEntitiesApi.toggleStarred('component:default/example-starred-entity-3');
starredEntitiesApi.toggleStarred('component:default/example-starred-entity-4');

export default {
  title: 'Plugins/Home/Templates',
  decorators: [
    (Story: ((props: {}) => JSX.Element)) =>
      wrapInTestApp(
        <>
          <TestApiProvider
            apis={[
              [catalogApiRef, mockCatalogApi],
              [starredEntitiesApiRef, starredEntitiesApi],
              [searchApiRef, { query: () => Promise.resolve({ results: [] }) }],
              [
                configApiRef,
                new ConfigReader({
                  backend: {
                    baseUrl: 'https://localhost:7007',
                  },
                }),
              ],
            ]}
          >
            <Story />
          </TestApiProvider>
        </>,
        {
          mountedRoutes: {
            '/hello-company': searchPlugin.routes.root,
            '/catalog/:namespace/:kind/:name': entityRouteRef,
          },
        },
      ),
  ],
};
export const CustomizableTemplate = () => {
  // This is the default configuration that is shown to the user
  // when first arriving to the homepage.
  const defaultConfig = [
    {
      component: 'HomePageSearchBar',
      x: 0,
      y: 0,
      width: 12,
      height: 5,
    },
    {
      component: 'HomePageRandomJoke',
      x: 0,
      y: 2,
      width: 6,
      height: 16,
    },
    {
      component: 'HomePageStarredEntities',
      x: 6,
      y: 2,
      width: 6,
      height: 12,
    },
  ];

  return (
    <CustomHomepageGrid config={defaultConfig} rowHeight={10}>
      // Insert the allowed widgets inside the grid. User can add, organize and
      // remove the widgets as they want.
      <HomePageSearchBar />
      <HomePageRandomJoke />
      <HomePageCalendar />
      <MicrosoftCalendarCard />
      <HomePageStarredEntities />
    </CustomHomepageGrid>
  );
};
