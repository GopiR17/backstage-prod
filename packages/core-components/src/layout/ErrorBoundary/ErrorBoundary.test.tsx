/* eslint-disable no-console */
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
import { ErrorBoundary } from './ErrorBoundary';
import {
  MockErrorApi,
  renderInTestApp,
  TestApiProvider,
  withLogCollector,
} from '@backstage/test-utils';
import { errorApiRef } from '@backstage/core-plugin-api';

type BombProps = {
  shouldThrow?: boolean;
  children?: React.ReactNode;
};

const Bomb = ({ shouldThrow }: BombProps) => {
  if (shouldThrow) {
    throw new Error('The bomb blew up');
  } else {
    return <p>Working Component</p>;
  }
};

class Meh extends React.Component<{ error: Error }> {
  render() {
    return <div>catpants + {this.props.error.message}</div>;
  }
}
describe('<ErrorBoundary/>', () => {
  let errorApi: MockErrorApi;

  beforeEach(() => {
    errorApi = new MockErrorApi();
  });

  it('should render error boundary with and without error', async () => {
    const { error } = await withLogCollector(['error'], async () => {
      const { rerender, queryByRole, getByRole, getByText } =
        await renderInTestApp(
          <TestApiProvider apis={[[errorApiRef, errorApi]]}>
            <ErrorBoundary>
              <Bomb />
            </ErrorBoundary>
          </TestApiProvider>,
        );

      expect(queryByRole('alert')).not.toBeInTheDocument();
      expect(getByText(/working component/i)).toBeInTheDocument();

      rerender(
        <TestApiProvider apis={[[errorApiRef, errorApi]]}>
          <ErrorBoundary>
            <Bomb shouldThrow />
          </ErrorBoundary>
        </TestApiProvider>,
      );

      expect(getByRole('alert')).toBeInTheDocument();
      expect(getByText(/something went wrong/i)).toBeInTheDocument();
    });

    expect(error).toEqual([
      expect.objectContaining({
        detail: new Error('The bomb blew up'),
      }),
      expect.stringMatching(
        /^The above error occurred in the <Bomb> component:/,
      ),
      expect.stringMatching(/^ErrorBoundary/),
    ]);
    expect(error.length).toEqual(3);
  });

  it('should call onError prop', async () => {
    const onError = jest.fn();

    await renderInTestApp(
      <TestApiProvider apis={[[errorApiRef, errorApi]]}>
        <ErrorBoundary onError={onError}>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </TestApiProvider>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.lastCall).toHaveLength(2);
    expect(onError.mock.lastCall[0]).toBeInstanceOf(Error);
  });

  it('should render custom fallback', async () => {
    const errorElement = <div>cat + pants = catpants</div>;

    const { getByText, queryByText } = await renderInTestApp(
      <TestApiProvider apis={[[errorApiRef, errorApi]]}>
        <ErrorBoundary fallback={errorElement}>
          <Bomb shouldThrow />
        </ErrorBoundary>
      </TestApiProvider>,
    );

    expect(getByText(/catpants/i)).toBeInTheDocument();
    expect(queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it.each`
    propName               | component
    ${'FallbackComponent'} | ${Meh}
    ${'fallbackRender'}    | ${({ error }: { error: Error }) => <div>catpants + {error.message}</div>}
  `(
    'should render fallback with prop: $propName',
    async ({ component, propName }) => {
      const props = { [propName]: component };

      const { getByText, queryByText } = await renderInTestApp(
        <TestApiProvider apis={[[errorApiRef, errorApi]]}>
          <ErrorBoundary {...props}>
            <Bomb shouldThrow />
          </ErrorBoundary>
        </TestApiProvider>,
      );

      expect(getByText(/catpants/i)).toBeInTheDocument();
      expect(queryByText(/something went wrong/i)).not.toBeInTheDocument();

      expect(queryByText(/the bomb blew up/i)).toBeInTheDocument();
    },
  );
});
