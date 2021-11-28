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

import { AbortSignal } from 'node-abort-controller';

/**
 * A function that accepts a context and produces a new, derived context from,
 * decorated with some specific behavior.
 *
 * @public
 */
export type ContextDecorator = (ctx: Context) => Context;

/**
 * A context that is meant to be passed as a ctx variable down the call chain,
 * to pass along scoped information and abort signals.
 *
 * @public
 */
export interface Context {
  /**
   * Returns an abort signal that triggers when the current context or any of
   * its parents signal for it.
   */
  readonly abortSignal: AbortSignal;

  /**
   * The point in time when the current context shall time out and abort, if
   * applicable.
   */
  readonly deadline: Date | undefined;

  /**
   * Attempts to get a stored value by key from the context.
   *
   * @param key - The key of the value to get
   * @returns The associated value, or undefined if not set
   */
  value<T = unknown>(key: string | symbol): T | undefined;

  /**
   * Decorates this context with one or more behaviors.
   *
   * @remarks
   *
   * The decorators are applied in the order that they are given.
   *
   * @param decorators - The decorators to apply
   * @returns A derived context with the relevant behaviors
   */
  use(...decorators: ContextDecorator[]): Context;
}
