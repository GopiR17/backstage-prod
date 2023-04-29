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
import React from 'react';

import {
  Avatar,
  Container,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from '@material-ui/core';

import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import { DateTime } from 'luxon';

import { useEvents } from './useEvents';
import { Skeleton } from '@material-ui/lab';
import { DismissableBanner } from '@backstage/core-components';
import { Event } from 'kubernetes-models/v1';

interface EventsContentProps {
  warningEventsOnly?: boolean;
  events: Event[];
}

const getAvatarByType = (type?: string) => {
  return (
    <ListItemAvatar>
      <Avatar>{type === 'Warning' ? <WarningIcon /> : <InfoIcon />}</Avatar>
    </ListItemAvatar>
  );
};

export const EventsContent = ({
  events,
  warningEventsOnly,
}: EventsContentProps) => {
  if (events.length === 0) {
    return <Typography>No events found</Typography>;
  }

  return (
    <Container>
      <Grid>
        <List>
          {events
            .filter(event => {
              if (warningEventsOnly) {
                return event.type === 'Warning';
              }
              return true;
            })
            .map(event => {
              const timeAgo = DateTime.fromISO(
                event.metadata.creationTimestamp as any,
              ).toRelative({
                locale: 'en',
              });
              return (
                <ListItem key={event.metadata.name}>
                  <Tooltip title={`${event.type ?? ''} event`}>
                    {getAvatarByType(event.type)}
                  </Tooltip>
                  <ListItemText
                    primary={`First event ${timeAgo} (count: ${event.count})`}
                    secondary={`${event.reason}: ${event.message}`}
                  />
                </ListItem>
              );
            })}
        </List>
      </Grid>
    </Container>
  );
};

interface EventsProps {
  involvedObjectName: string;
  namespace: string;
  clusterName: string;
  warningEventsOnly?: boolean;
}

export const Events = ({
  involvedObjectName,
  namespace,
  clusterName,
  warningEventsOnly,
}: EventsProps) => {
  const { value, error, loading } = useEvents({
    involvedObjectName,
    namespace,
    clusterName,
  });

  return (
    <>
      {error && (
        <DismissableBanner
          {...{
            message: error.message,
            variant: 'error',
            fixed: false,
          }}
          id="events"
        />
      )}
      {loading && <Skeleton variant="rect" width="100%" height="100%" />}
      {!loading && value !== undefined && (
        <EventsContent warningEventsOnly={warningEventsOnly} events={value} />
      )}
    </>
  );
};
