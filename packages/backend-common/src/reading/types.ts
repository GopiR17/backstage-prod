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

import { Readable } from 'stream';
import { Config } from '@backstage/config';
import {
  UrlReaderService,
  LoggerService,
  UrlReaderReadTreeOptions,
  UrlReaderReadTreeResponse,
  UrlReaderReadTreeResponseDirOptions,
  UrlReaderReadTreeResponseFile,
  UrlReaderReadUrlResponse,
  UrlReaderReadUrlOptions,
  UrlReaderSearchOptions,
  UrlReaderSearchResponse,
  UrlReaderSearchResponseFile,
} from '@backstage/backend-plugin-api';

/**
 * @public
 * @deprecated Use `UrlReaderService` from `@backstage/backend-plugin-api` instead
 */
export type UrlReader = UrlReaderService;
/**
 * @public
 * @deprecated Use `UrlReaderReadTreeOptions` from `@backstage/backend-plugin-api` instead
 */
export type ReadTreeOptions = UrlReaderReadTreeOptions;
/**
 * @public
 * @deprecated Use `UrlReaderReadTreeResponse` from `@backstage/backend-plugin-api` instead
 */
export type ReadTreeResponse = UrlReaderReadTreeResponse;
/**
 * @public
 * @deprecated Use `UrlReaderReadTreeResponseDirOptions` from `@backstage/backend-plugin-api` instead
 */
export type ReadTreeResponseDirOptions = UrlReaderReadTreeResponseDirOptions;
/**
 * @public
 * @deprecated Use `UrlReaderReadTreeResponseFile` from `@backstage/backend-plugin-api` instead
 */
export type ReadTreeResponseFile = UrlReaderReadTreeResponseFile;
/**
 * @public
 * @deprecated Use `UrlReaderReadUrlResponse` from `@backstage/backend-plugin-api` instead
 */
export type ReadUrlResponse = UrlReaderReadUrlResponse;
/**
 * @public
 * @deprecated Use `UrlReaderReadUrlOptions` from `@backstage/backend-plugin-api` instead
 */
export type ReadUrlOptions = UrlReaderReadUrlOptions;
/**
 * @public
 * @deprecated Use `UrlReaderSearchOptions` from `@backstage/backend-plugin-api` instead
 */
export type SearchOptions = UrlReaderSearchOptions;
/**
 * @public
 * @deprecated Use `UrlReaderSearchResponse` from `@backstage/backend-plugin-api` instead
 */
export type SearchResponse = UrlReaderSearchResponse;
/**
 * @public
 * @deprecated Use `UrlReaderSearchResponseFile` from `@backstage/backend-plugin-api` instead
 */
export type SearchResponseFile = UrlReaderSearchResponseFile;

/**
 * A predicate that decides whether a specific {@link @backstage/backend-plugin-api#UrlReaderService} can handle a
 * given URL.
 *
 * @public
 * @deprecated import from `@backstage/backend-defaults/urlReader` instead
 */
export type UrlReaderPredicateTuple = {
  predicate: (url: URL) => boolean;
  reader: UrlReaderService;
};

/**
 * A factory function that can read config to construct zero or more
 * {@link @backstage/backend-plugin-api#UrlReaderService}s along with a predicate for when it should be used.
 *
 * @public
 * @deprecated import from `@backstage/backend-defaults/urlReader` instead
 */
export type ReaderFactory = (options: {
  config: Config;
  logger: LoggerService;
  treeResponseFactory: ReadTreeResponseFactory;
}) => UrlReaderPredicateTuple[];

/**
 * An options object for {@link ReadUrlResponseFactory} factory methods.
 *
 * @public
 * @deprecated import from `@backstage/backend-defaults/urlReader` instead
 */
export type ReadUrlResponseFactoryFromStreamOptions = {
  etag?: string;
  lastModifiedAt?: Date;
};

/**
 * Options that control execution of {@link ReadTreeResponseFactory} methods.
 *
 * @public
 * @deprecated import from `@backstage/backend-defaults/urlReader` instead
 */
export type ReadTreeResponseFactoryOptions = {
  // A binary stream of a tar archive.
  stream: Readable;
  // If unset, the files at the root of the tree will be read.
  // subpath must not contain the name of the top level directory.
  subpath?: string;
  // etag of the blob
  etag: string;
  // Filter passed on from the ReadTreeOptions
  filter?: (path: string, info?: { size: number }) => boolean;
};

/**
 * Options that control {@link ReadTreeResponseFactory.fromReadableArray}
 * execution.
 *
 * @public
 * @deprecated import from `@backstage/backend-defaults/urlReader` instead
 */
export type FromReadableArrayOptions = Array<{
  /**
   * The raw data itself.
   */
  data: Readable;

  /**
   * The filepath of the data.
   */
  path: string;

  /**
   * Last modified date of the file contents.
   */
  lastModifiedAt?: Date;
}>;

/**
 * A factory for response factories that handle the unpacking and inspection of
 * complex responses such as archive data.
 *
 * @public
 * @deprecated import from `@backstage/backend-defaults/urlReader` instead
 */
export interface ReadTreeResponseFactory {
  fromTarArchive(
    options: ReadTreeResponseFactoryOptions & {
      /**
       * Strip the first parent directory of a tar archive.
       * Defaults to true.
       */
      stripFirstDirectory?: boolean;
    },
  ): Promise<UrlReaderReadTreeResponse>;
  fromZipArchive(
    options: ReadTreeResponseFactoryOptions,
  ): Promise<UrlReaderReadTreeResponse>;
  fromReadableArray(
    options: FromReadableArrayOptions,
  ): Promise<UrlReaderReadTreeResponse>;
}
