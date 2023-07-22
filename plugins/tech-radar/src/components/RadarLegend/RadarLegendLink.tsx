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
import { Link, makeStyles, Theme } from '@material-ui/core';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { EntrySnapshot } from '../../utils/types';
import { RadarDescription } from '../RadarDescription';

type RadarLegendLinkProps = {
  url?: string;
  description?: string;
  title?: string;
  classes: ClassNameMap<string>;
  active?: boolean;
  links: Array<{ url: string; title: string }>;
  timeline: EntrySnapshot[];
};

const useStyles = makeStyles<Theme>(() => ({
  entryLink: {
    cursor: 'pointer',
  },
}));

export const RadarLegendLink = (props: RadarLegendLinkProps) => {
  const { url, description, title, active, links, timeline, classes } = props;
  const internalClasses = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const toggle = () => {
    setOpen(!open);
  };

  return (
    <>
      {/** TODO(sennyeya): Update this to use the internal link implementation which requires to={...}. */}
      <Link
        component="a"
        onClick={handleClickOpen}
        role="button"
        tabIndex={0}
        className={internalClasses.entryLink}
        onKeyPress={toggle}
      >
        <Typography
          component="span"
          variant="inherit"
          className={active ? classes.activeEntry : classes.entry}
        >
          {title}
        </Typography>
      </Link>
      {open && (
        <RadarDescription
          open={open}
          onClose={handleClose}
          title={title ? title : 'no title'}
          url={url}
          description={description}
          timeline={timeline ? timeline : []}
          links={links}
        />
      )}
    </>
  );
};
