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

import { HelpIcon, useApp } from '@backstage/core-api';
import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Popover,
} from '@material-ui/core';
import React, {
  Fragment,
  MouseEventHandler,
  ReactChild,
  useState,
} from 'react';
import { SupportItem, SupportItemLink, useSupportConfig } from '../../hooks';
import { Link } from '../Link';

const useStyles = makeStyles(theme => ({
  leftIcon: {
    marginRight: theme.spacing(1),
  },
  popoverList: {
    minWidth: 260,
    maxWidth: 400,
  },
}));

const SupportIcon = ({ icon }: { icon: string | undefined }) => {
  const app = useApp();
  const Icon = icon ? app.getSystemIcon(icon) ?? HelpIcon : HelpIcon;
  return <Icon />;
};

const SupportLink = ({ link }: { link: SupportItemLink }) => (
  <Link to={link.url} target="_blank" rel="noreferrer noopener">
    {link.title ?? link.url}
  </Link>
);

const SupportListItem = ({ item }: { item: SupportItem }) => {
  return (
    <ListItem>
      <ListItemIcon>
        <SupportIcon icon={item.icon} />
      </ListItemIcon>
      <ListItemText
        primary={item.title}
        secondary={item.links?.reduce<React.ReactNodeArray>(
          (prev, link, idx) => [
            ...prev,
            idx > 0 && <br key={idx} />,
            <SupportLink link={link} key={link.url} />,
          ],
          [],
        )}
      />
    </ListItem>
  );
};

type SupportButtonProps = {
  title?: ReactChild;
  supportItems?: SupportItem[];
  displayMode?: 'customOnly' | 'all' | '';
};

export const SupportButton = ({
  supportItems,
  title,
  displayMode = '',
}: SupportButtonProps) => {
  const { items } = useSupportConfig();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const classes = useStyles();
  const displayedItems = supportItems && [...supportItems, ...items];

  const onClickHandler: MouseEventHandler = event => {
    setAnchorEl(event.currentTarget);
    setPopoverOpen(true);
  };

  const popoverCloseHandler = () => {
    setPopoverOpen(false);
  };

  const displayItems = () => {
    switch (displayMode) {
      case 'customOnly':
        return (
          <>
            {supportItems &&
              supportItems.map((item, i) => (
                <SupportListItem item={item} key={i} />
              ))}
          </>
        );

      case 'all':
        return (
          <>
            {displayedItems &&
              displayedItems.map((item, i) => (
                <SupportListItem item={item} key={i} />
              ))}
          </>
        );

      default:
        return (
          <>
            {items.map((item, i) => (
              <SupportListItem item={item} key={i} />
            ))}
          </>
        );
    }
  };

  return (
    <Fragment>
      <Button
        data-testid="support-button"
        color="primary"
        onClick={onClickHandler}
      >
        <HelpIcon className={classes.leftIcon} />
        Support
      </Button>
      <Popover
        data-testid="support-button-popover"
        open={popoverOpen}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onClose={popoverCloseHandler}
      >
        <List className={classes.popoverList}>
          {React.Children.map(title, (child, i) => (
            <ListItem alignItems="flex-start" key={i}>
              {child}
            </ListItem>
          ))}
          {displayItems()}
        </List>
      </Popover>
    </Fragment>
  );
};
