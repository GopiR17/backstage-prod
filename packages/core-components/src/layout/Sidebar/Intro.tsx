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
import { BackstageTheme } from '@backstage/theme';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import grey from '@material-ui/core/colors/grey';
import { useLocalStorageValue } from '@react-hookz/web';
import React, { useContext, useState } from 'react';

import {
  SIDEBAR_INTRO_LOCAL_STORAGE,
  SidebarConfig,
  SidebarConfigContext,
} from './config';
import { SidebarDivider } from './Items';
import { useSidebarOpenState } from './SidebarOpenStateContext';

/** @public */
export type SidebarIntroClassKey =
  | 'introCard'
  | 'introDismiss'
  | 'introDismissLink'
  | 'introDismissText'
  | 'introDismissIcon';

const useStyles = makeStyles<BackstageTheme, { sidebarConfig: SidebarConfig }>(
  theme => ({
    introCard: props => ({
      color: grey[400],
      // XXX (@koroeskohr): should I be using a Mui theme variable?
      fontSize: 12,
      width: props.sidebarConfig.drawerWidthOpen,
      marginTop: theme.spacing(2.25),
      marginBottom: theme.spacing(1.5),
      paddingLeft: props.sidebarConfig.iconPadding,
      paddingRight: props.sidebarConfig.iconPadding,
    }),
    introDismiss: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: theme.spacing(1.5),
    },
    introDismissLink: {
      color: grey[300],
      display: 'flex',
      alignItems: 'center',
      marginBottom: theme.spacing(0.5),
      '&:hover': {
        color: theme.palette.linkHover,
        transition: theme.transitions.create('color', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.shortest,
        }),
      },
    },
    introDismissText: {
      fontSize: '0.7rem',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    introDismissIcon: {
      width: 18,
      height: 18,
      marginRight: theme.spacing(1.5),
    },
  }),
  { name: 'BackstageSidebarIntro' },
);

type IntroCardProps = {
  text: string;
  onClose: () => void;
};

/**
 * Closable card with information from Navigation Sidebar
 *
 * @public
 *
 */

export function IntroCard(props: IntroCardProps) {
  const { sidebarConfig } = useContext(SidebarConfigContext);
  const classes = useStyles({ sidebarConfig });
  const { text, onClose } = props;
  const handleClose = () => onClose();

  return (
    <Box className={classes.introCard}>
      <Typography variant="subtitle2">{text}</Typography>
      <Box className={classes.introDismiss}>
        <IconButton onClick={handleClose} className={classes.introDismissLink}>
          <CloseIcon className={classes.introDismissIcon} />
          <Typography component="span" className={classes.introDismissText}>
            Dismiss
          </Typography>
        </IconButton>
      </Box>
    </Box>
  );
}

type SidebarIntroLocalStorage = {
  starredItemsDismissed: boolean;
  recentlyViewedItemsDismissed: boolean;
};

type SidebarIntroCardProps = {
  text: string;
  onDismiss: () => void;
};

const SidebarIntroCard = (props: SidebarIntroCardProps) => {
  const { text, onDismiss } = props;
  const [collapsing, setCollapsing] = useState(false);
  const startDismissing = () => {
    setCollapsing(true);
  };
  return (
    <Collapse in={!collapsing} onExited={onDismiss}>
      <IntroCard text={text} onClose={startDismissing} />
    </Collapse>
  );
};

const starredIntroText = `Fun fact! As you explore all the awesome plugins in Backstage, you can actually pin them to this side nav.
Keep an eye out for the little star icon (⭐) next to the plugin name and give it a click!`;
const recentlyViewedIntroText =
  'And your recently viewed plugins will pop up here!';

export function SidebarIntro(_props: {}) {
  const { isOpen } = useSidebarOpenState();
  const defaultValue = {
    starredItemsDismissed: false,
    recentlyViewedItemsDismissed: false,
  };
  const { value: dismissedIntro, set: setDismissedIntro } =
    useLocalStorageValue<SidebarIntroLocalStorage>(SIDEBAR_INTRO_LOCAL_STORAGE);

  const { starredItemsDismissed, recentlyViewedItemsDismissed } =
    dismissedIntro ?? {};

  const dismissStarred = () => {
    setDismissedIntro(state => ({
      ...defaultValue,
      ...state,
      starredItemsDismissed: true,
    }));
  };
  const dismissRecentlyViewed = () => {
    setDismissedIntro(state => ({
      ...defaultValue,
      ...state,
      recentlyViewedItemsDismissed: true,
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {!starredItemsDismissed && (
        <>
          <SidebarIntroCard
            text={starredIntroText}
            onDismiss={dismissStarred}
          />
          <SidebarDivider />
        </>
      )}
      {!recentlyViewedItemsDismissed && (
        <SidebarIntroCard
          text={recentlyViewedIntroText}
          onDismiss={dismissRecentlyViewed}
        />
      )}
    </>
  );
}
