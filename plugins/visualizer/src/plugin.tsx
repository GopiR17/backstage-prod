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

import {
  createNavItemExtension,
  createPageExtension,
  createPlugin,
  createRouteRef,
} from '@backstage/frontend-plugin-api';
import VisualizerIcon from '@material-ui/icons/Visibility';
import React from 'react';

const rootRouteRef = createRouteRef();

const visualizerPage = createPageExtension({
  defaultPath: '/visualizer',
  routeRef: rootRouteRef,
  loader: () =>
    import('./components/AppVisualizerPage').then(m => <m.AppVisualizerPage />),
});

export const visualizerNavItem = createNavItemExtension({
  title: 'Visualizer',
  icon: VisualizerIcon,
  routeRef: rootRouteRef,
});

export const visualizerPlugin = createPlugin({
  id: 'visualizer',
  extensions: [visualizerPage, visualizerNavItem],
});
