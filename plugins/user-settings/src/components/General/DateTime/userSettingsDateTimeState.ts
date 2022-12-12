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
import useObservable from 'react-use/lib/useObservable';

import { storageApiRef, useApi } from '@backstage/core-plugin-api';
import { JsonValue } from '@backstage/types';

enum UserSettingsDateTimeStorageKey {
  HourCycle = 'HourCycle',
}

const BUCKET = 'settings-datetime';

const useStorageApi = <T extends JsonValue>(
  storageBucket: string,
  storageKey: string,
  defaultValue: T,
): [T, (value: T) => void, boolean] => {
  const storageApi = useApi(storageApiRef).forBucket(storageBucket);

  const setValue = (jql: T) => {
    storageApi.set(storageKey, jql);
  };

  const snapshot = useObservable(
    storageApi.observe$<T>(storageKey),
    storageApi.snapshot(storageKey),
  );

  const isInitialized = snapshot.presence !== 'unknown';
  let result: T;

  if (snapshot.presence === 'present') {
    result = snapshot.value!;
  } else {
    result = defaultValue;
  }

  return [result, setValue, isInitialized];
};

/** @public */
export function use24HourTimeState(): [
  boolean,
  (value: boolean) => void,
  boolean,
] {
  return useStorageApi(
    BUCKET,
    UserSettingsDateTimeStorageKey.HourCycle,
    true as boolean,
  );
}
