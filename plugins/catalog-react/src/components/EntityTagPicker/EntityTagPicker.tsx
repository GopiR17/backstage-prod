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

import { makeStyles } from '@material-ui/core';
import React from 'react';
import { EntityTagFilter } from '../../filters';
import { EntityAutocompletePicker } from '../EntityAutocompletePicker/EntityAutocompletePicker';

/** @public */
export type CatalogReactEntityTagPickerClassKey = 'input';

/** @public */
export type EntityTagPickerProps = {
  showCounts?: boolean;
  optionsSortFn?: (option1: string, option2: string) => number;
};

const useStyles = makeStyles(
  { input: {} },
  { name: 'CatalogReactEntityTagPicker' },
);

/** @public */
export const EntityTagPicker = (props: EntityTagPickerProps) => {
  const { showCounts, optionsSortFn } = props;
  const classes = useStyles();

  return (
    <EntityAutocompletePicker
      label="Tags"
      name="tags"
      path="metadata.tags"
      Filter={EntityTagFilter}
      showCounts={showCounts}
      InputProps={{ className: classes.input }}
      optionsSortFn={optionsSortFn}
    />
  );
};
