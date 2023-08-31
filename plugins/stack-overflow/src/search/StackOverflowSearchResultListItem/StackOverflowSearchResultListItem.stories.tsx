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

import { wrapInTestApp } from '@backstage/test-utils';
import React, { PropsWithChildren } from 'react';
import { StackOverflowIcon } from '../../icons';
import { StackOverflowSearchResultListItem } from '../../plugin';

export default {
  title: 'Plugins/Search/StackOverflowResultListItem',
  component: StackOverflowSearchResultListItem,
  decorators: [
    (Story: (props: PropsWithChildren<{}>) => JSX.Element) =>
      wrapInTestApp(<Story />),
  ],
};

export const Default = () => {
  return (
    <StackOverflowSearchResultListItem
      result={{
        title: 'Customizing Spotify backstage UI',
        text: 'Name of Author',
        location: 'stackoverflow.question/1',
        answers: 0,
        tags: ['backstage'],
      }}
    />
  );
};

export const WithIcon = () => {
  return (
    <StackOverflowSearchResultListItem
      result={{
        title: 'Customizing Spotify backstage UI',
        text: 'Name of Author',
        location: 'stackoverflow.question/1',
        answers: 0,
        tags: ['backstage'],
      }}
      icon={<StackOverflowIcon />}
    />
  );
};

export const WithHighlight = () => {
  return (
    <StackOverflowSearchResultListItem
      result={{
        title: 'Customizing Spotify backstage UI',
        text: 'Name of Author',
        location: 'stackoverflow.question/1',
        answers: 0,
        tags: ['backstage'],
      }}
      icon={<StackOverflowIcon />}
      highlight={{
        fields: { title: '<xyz>Customizing</xyz> Spotify backstage ui' },
        preTag: '<xyz>',
        postTag: '</xyz>',
      }}
    />
  );
};
