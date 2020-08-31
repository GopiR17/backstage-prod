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

import React from 'react';
import {
  Header,
  Page,
  HeaderLabel,
  ContentHeader,
  Content,
  pageTheme,
} from '../';
import { SupportButton, Table, StatusOK, TableColumn } from '../../components';
import SettingsIcon from '@material-ui/icons/Settings';
import Button from '@material-ui/core/Button';
import { Box, Typography, Link, Chip } from '@material-ui/core';

export default {
  title: 'Example Plugin',
  component: Page,
};

const generateTestData: (number: number) => Array<{}> = (rows = 10) => {
  const data: Array<{}> = [];
  while (data.length <= rows) {
    data.push({
      message: `A very important message`,
      id: data.length + 18534,
      branchName: 'techdocs: modify documentation header',
      hash: 'techdocs/docs-header 5749c98e3f61f8bb116e5cb87b0e4e1 ',
      status: 'Success',
    });
  }

  return data;
};

const columns: TableColumn[] = [
  {
    title: 'ID',
    field: 'id',
    highlight: true,
    type: 'numeric',
    width: '80px',
  },
  {
    title: 'Message/Source',
    highlight: true,
    render: row => (
      <>
        <Link>{row.branchName}</Link>
        <Typography variant="body2">{row.hash}</Typography>
      </>
    ),
  },
  {
    title: 'Status',
    render: row => (
      <Box display="flex" alignItems="center">
        <StatusOK />
        <Typography variant="body2">{row.status}</Typography>
      </Box>
    ),
  },
  {
    title: 'Tags',
    render: () => <Chip label="Tag Name" />,
    width: '10%',
  },
];

export const PluginWithTable = () => {
  return (
    <Page theme={pageTheme.tool}>
      <Header title="Example" subtitle="This an example plugin">
        <HeaderLabel label="Owner" value="Owner" />
        <HeaderLabel label="Lifecycle" value="Lifecycle" />
      </Header>
      <Content>
        <ContentHeader
          title="Plugin Header"
          titleComponent={() => (
            <Box alignItems="center" display="flex">
              <Typography variant="h4">Header</Typography>
            </Box>
          )}
        >
          <Button onClick={() => {}} startIcon={<SettingsIcon />}>
            Settings
          </Button>
          <SupportButton>
            This Plugin is an example. If this would not be an example, this
            text could provide usefull information for the user.
          </SupportButton>
        </ContentHeader>
        <Table
          options={{ paging: true, padding: 'dense' }}
          data={generateTestData(10)}
          columns={columns}
          title="Example Content"
        />
      </Content>
    </Page>
  );
};
