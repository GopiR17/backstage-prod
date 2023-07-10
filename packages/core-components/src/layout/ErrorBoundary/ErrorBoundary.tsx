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

import Typography from '@material-ui/core/Typography';
import React, { ComponentClass, Component, ErrorInfo } from 'react';
import { LinkButton } from '../../components/LinkButton';
import { ErrorPanel } from '../../components/ErrorPanel';

type SlackChannel = {
  name: string;
  href?: string;
};

/** @public */
export type FallbackProps = {
  error?: Error;
  componentStack?: string;
  resetErrorBoundary: () => void;
};

/** @public */
export type ErrorBoundaryProps = {
  fallback?: React.ReactElement;
  FallbackComponent?: React.ComponentType<FallbackProps>;
  fallbackRender?: (props: FallbackProps) => React.ReactElement;
  onError?: (error: Error, errorInfo: ErrorInfo) => null;
  slackChannel?: string | SlackChannel;
};

type State = {
  error?: Error;
  errorInfo?: ErrorInfo;
};

const SlackLink = (props: { slackChannel?: string | SlackChannel }) => {
  const { slackChannel } = props;

  if (!slackChannel) {
    return null;
  } else if (typeof slackChannel === 'string') {
    return <Typography>Please contact {slackChannel} for help.</Typography>;
  } else if (!slackChannel.href) {
    return (
      <Typography>Please contact {slackChannel.name} for help.</Typography>
    );
  }

  return (
    <LinkButton to={slackChannel.href} variant="contained">
      {slackChannel.name}
    </LinkButton>
  );
};

const initialState = {
  error: undefined,
  errorInfo: undefined,
};

/** @public */
export const ErrorBoundary: ComponentClass<
  ErrorBoundaryProps,
  State
> = class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state = initialState;

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`ErrorBoundary, error: ${error}, info: ${errorInfo}`);
    this.props.onError?.(error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetErrorBoundary = () => this.setState(initialState);

  render() {
    const { fallback, FallbackComponent, fallbackRender } = this.props;
    const { error, errorInfo } = this.state;

    if (error) {
      if (fallback) {
        return fallback;
      }

      const errorProps: FallbackProps = {
        componentStack: errorInfo?.componentStack,
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      };

      if (fallbackRender) {
        return fallbackRender(errorProps);
      }

      if (FallbackComponent) {
        return <FallbackComponent {...errorProps} />;
      }

      return (
        <ErrorPanel title="Something Went Wrong" error={error}>
          <SlackLink slackChannel={this.props.slackChannel} />
        </ErrorPanel>
      );
    }

    return this.props.children;
  }
};
