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

import { Header } from '@backstage/core';

type TechDocsPageHeaderProps = {
  title: string;
  subtitle: string;
  labels: any;
};

export const TechDocsHeader = ({
  title,
  subtitle,
  labels,
}: TechDocsPageHeaderProps) => {
  if (!labels) return <Header title={title} subtitle={subtitle} />;

  return (
    <Header title={title} subtitle={subtitle}>
      {labels}
    </Header>
  );
};
