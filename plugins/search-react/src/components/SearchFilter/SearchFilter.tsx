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

import React, { ReactElement, ChangeEvent } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import {
  makeStyles,
  FormControl,
  FormControlLabel,
  InputLabel,
  Checkbox,
  Select,
  MenuItem,
  FormLabel,
} from '@material-ui/core';
import { JsonValue } from '@backstage/types';

import { useSearch } from '../../context';
import {
  AutocompleteFilter,
  SearchAutocompleteFilterProps,
} from './SearchFilter.Autocomplete';
import { useAsyncFilterValues, useDefaultFilterValue } from './hooks';

const useStyles = makeStyles(
  {
    label: {
      textTransform: 'capitalize',
    },
    menu: {},
  },
  { name: 'SearchFilter' },
);

/**
 * @public
 */
export type SearchFilterComponentProps = {
  className?: string;
  name: string;
  label?: string;
  /**
   * Either an array of values directly, or an async function to return a list
   * of values to be used in the filter. In the autocomplete filter, the last
   * input value is provided as an input to allow values to be filtered. This
   * function is debounced and values cached.
   */
  values?: string[] | ((partial: string) => Promise<string[]>);
  defaultValue?: string[] | string | null;
  /**
   * Debounce time in milliseconds, used when values is an async callback.
   * Defaults to 250ms.
   */
  valuesDebounceMs?: number;
};

/**
 * @public
 */
export type SearchFilterWrapperProps = SearchFilterComponentProps & {
  component: (props: SearchFilterComponentProps) => ReactElement;
  debug?: boolean;
};

/**
 * @public
 */
export interface SelectFilterProps<T extends JsonValue = string>
  extends SearchFilterComponentProps {
  multiple?: boolean;
  emptyItemLabel?: string;
  placeholder?: string;
  renderValue?: (selected: T) => string;
  fullWidth?: boolean;
}

/**
 * @public
 */
export const CheckboxFilter = (props: SearchFilterComponentProps) => {
  const {
    className,
    defaultValue,
    label,
    name,
    values: givenValues = [],
    valuesDebounceMs,
  } = props;
  const classes = useStyles();
  const { filters, setFilters } = useSearch();
  useDefaultFilterValue(name, defaultValue);

  const { value: values = [], loading } = useAsyncFilterValues(
    givenValues,
    '',
    valuesDebounceMs,
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value, checked },
    } = e;

    setFilters(prevFilters => {
      const { [name]: filter, ...others } = prevFilters;
      const rest = ((filter as string[]) || []).filter(i => i !== value);
      const items = checked ? [...rest, value] : rest;
      return items.length ? { ...others, [name]: items } : others;
    });
  };

  return (
    <FormControl
      className={className}
      disabled={loading}
      fullWidth
      data-testid="search-checkboxfilter-next"
    >
      {label ? <FormLabel className={classes.label}>{label}</FormLabel> : null}
      {values.map((value: string) => (
        <FormControlLabel
          key={value}
          control={
            <Checkbox
              color="primary"
              tabIndex={-1}
              inputProps={{ 'aria-labelledby': value }}
              value={value}
              name={value}
              onChange={handleChange}
              checked={((filters[name] as string[]) ?? []).includes(value)}
            />
          }
          label={value}
        />
      ))}
    </FormControl>
  );
};

/**
 * @public
 */
export function SelectFilter<T extends JsonValue = string>(
  props: SelectFilterProps<T>,
) {
  const {
    className,
    defaultValue,
    label,
    name,
    placeholder,
    values: givenValues,
    valuesDebounceMs,
    renderValue,
    fullWidth = true,
    multiple = false,
    emptyItemLabel = 'All',
  } = props;

  const classes = useStyles();
  useDefaultFilterValue(name, defaultValue);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { value: values = [], loading } = useAsyncFilterValues(
    givenValues,
    '',
    valuesDebounceMs,
  );

  const { filters, setFilters } = useSearch();

  const handleChange = (e: ChangeEvent<{ value: unknown }>) => {
    const {
      target: { value },
    } = e;

    setFilters(prevFilters => {
      const { [props.name]: filter, ...others } = prevFilters;

      return _.isEmpty(value)
        ? others
        : { ...others, [props.name]: value as T };
    });
  };

  const displayEmpty = !label;

  return (
    <FormControl
      disabled={loading}
      className={className}
      variant="filled"
      fullWidth={fullWidth}
      data-testid="search-selectfilter-next"
    >
      {label ? (
        <InputLabel className={classes.label} margin="dense">
          {label}
        </InputLabel>
      ) : null}
      <Select
        className={classnames({
          selected: filters[name],
        })}
        variant="outlined"
        value={filters[name] || (multiple ? [] : '')}
        onChange={handleChange}
        multiple={multiple}
        displayEmpty={displayEmpty}
        renderValue={selected => {
          if (displayEmpty && _.isEmpty(selected as T)) {
            return placeholder;
          }

          if (renderValue) {
            return renderValue(selected as T);
          }

          return selected as T;
        }}
        MenuProps={{
          className: classes.menu,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          getContentAnchorEl: null,
        }}
      >
        {!multiple && emptyItemLabel && (
          <MenuItem value="">{emptyItemLabel}</MenuItem>
        )}
        {values.map((value: string) => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/**
 * @public
 */
export const MultiselectFilter = (props: SearchFilterComponentProps) => {
  return (
    <SelectFilter<string[]>
      {...props}
      multiple
      renderValue={selected => selected.join(', ')}
    />
  );
};

/**
 * @public
 */
const SearchFilter = ({
  component: Element,
  ...props
}: SearchFilterWrapperProps) => <Element {...props} />;

SearchFilter.Checkbox = (
  props: Omit<SearchFilterWrapperProps, 'component'> &
    SearchFilterComponentProps,
) => <SearchFilter {...props} component={CheckboxFilter} />;

SearchFilter.Select = (
  props: Omit<SearchFilterWrapperProps, 'component'> & SelectFilterProps,
) => <SearchFilter {...props} component={SelectFilter} />;

SearchFilter.Multiselect = (
  props: Omit<SearchFilterWrapperProps, 'component'> &
    SearchFilterComponentProps,
) => <SearchFilter {...props} component={MultiselectFilter} />;

/**
 * A control surface for a given filter field name, rendered as an autocomplete
 * textfield. A hard-coded list of values may be provided, or an async function
 * which returns values may be provided instead.
 *
 * @public
 */
SearchFilter.Autocomplete = (props: SearchAutocompleteFilterProps) => (
  <SearchFilter {...props} component={AutocompleteFilter} />
);

export { SearchFilter };
