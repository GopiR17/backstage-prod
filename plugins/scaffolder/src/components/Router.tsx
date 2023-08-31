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

import { Entity } from '@backstage/catalog-model';
import { useRouteRef, useRouteRefParams } from '@backstage/core-plugin-api';
import { TemplateEntityV1beta3 } from '@backstage/plugin-scaffolder-common';
import {
  FieldExtensionOptions,
  SecretsContextProvider,
  useCustomFieldExtensions,
  useCustomLayouts,
} from '@backstage/plugin-scaffolder-react';
import React, { PropsWithChildren, useEffect } from 'react';
import { Navigate, Route, Routes, useOutlet } from 'react-router-dom';
import { DEFAULT_SCAFFOLDER_FIELD_EXTENSIONS } from '../extensions/default';
import {
  actionsRouteRef,
  editRouteRef,
  legacySelectedTemplateRouteRef,
  scaffolderListTaskRouteRef,
  scaffolderTaskRouteRef,
  selectedTemplateRouteRef,
} from '../routes';
import { ActionsPage } from './ActionsPage';
import { ListTasksPage } from './ListTasksPage';
import { ScaffolderPage } from './ScaffolderPage';
import { TaskPage } from './TaskPage';
import { TemplateEditorPage } from './TemplateEditorPage';
import { TemplatePage } from './TemplatePage';
import { ReviewStepProps } from './types';

/**
 * The props for the entrypoint `ScaffolderPage` component the plugin.
 * @public
 */
export type RouterProps = {
  components?: {
    ReviewStepComponent?: (props: ReviewStepProps) => JSX.Element;
    TemplateCardComponent?:
      | ((props: { template: TemplateEntityV1beta3 }) => JSX.Element)
      | undefined;
    TaskPageComponent?: (props: PropsWithChildren<{}>) => JSX.Element;
  };
  groups?: Array<{
    title?: React.ReactNode;
    filter: (entity: Entity) => boolean;
  }>;
  templateFilter?: (entity: TemplateEntityV1beta3) => boolean;
  defaultPreviewTemplate?: string;
  headerOptions?: {
    pageTitleOverride?: string;
    title?: string;
    subtitle?: string;
  };
  /**
   * Options for the context menu on the scaffolder page.
   */
  contextMenu?: {
    /** Whether to show a link to the template editor */
    editor?: boolean;
    /** Whether to show a link to the actions documentation */
    actions?: boolean;
  };
};

/**
 * The main entrypoint `Router` for the `ScaffolderPlugin`.
 *
 * @public
 */
export const Router = (props: RouterProps) => {
  const {
    groups,
    templateFilter,
    components = {},
    defaultPreviewTemplate,
  } = props;

  const { ReviewStepComponent, TemplateCardComponent, TaskPageComponent } =
    components;

  const outlet = useOutlet();
  const TaskPageElement = TaskPageComponent ?? TaskPage;

  const customFieldExtensions = useCustomFieldExtensions(outlet);
  const fieldExtensions = [
    ...customFieldExtensions,
    ...DEFAULT_SCAFFOLDER_FIELD_EXTENSIONS.filter(
      ({ name }) =>
        !customFieldExtensions.some(
          customFieldExtension => customFieldExtension.name === name,
        ),
    ),
  ] as FieldExtensionOptions[];

  const customLayouts = useCustomLayouts(outlet);

  /**
   * This component can be deleted once the older routes have been deprecated.
   */
  const RedirectingComponent = () => {
    const { templateName } = useRouteRefParams(legacySelectedTemplateRouteRef);
    const newLink = useRouteRef(selectedTemplateRouteRef);
    useEffect(
      () =>
        // eslint-disable-next-line no-console
        console.warn(
          'The route /template/:templateName is deprecated, please use the new /template/:namespace/:templateName route instead',
        ),
      [],
    );
    return <Navigate to={newLink({ namespace: 'default', templateName })} />;
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ScaffolderPage
            groups={groups}
            templateFilter={templateFilter}
            TemplateCardComponent={TemplateCardComponent}
            contextMenu={props.contextMenu}
            headerOptions={props.headerOptions}
          />
        }
      />
      <Route
        path={legacySelectedTemplateRouteRef.path}
        element={<RedirectingComponent />}
      />
      <Route
        path={selectedTemplateRouteRef.path}
        element={
          <SecretsContextProvider>
            <TemplatePage
              ReviewStepComponent={ReviewStepComponent}
              customFieldExtensions={fieldExtensions}
              layouts={customLayouts}
              headerOptions={props.headerOptions}
            />
          </SecretsContextProvider>
        }
      />
      <Route
        path={scaffolderListTaskRouteRef.path}
        element={<ListTasksPage />}
      />
      <Route path={scaffolderTaskRouteRef.path} element={<TaskPageElement />} />
      <Route path={actionsRouteRef.path} element={<ActionsPage />} />
      <Route
        path={editRouteRef.path}
        element={
          <SecretsContextProvider>
            <TemplateEditorPage
              defaultPreviewTemplate={defaultPreviewTemplate}
              customFieldExtensions={fieldExtensions}
              layouts={customLayouts}
            />
          </SecretsContextProvider>
        }
      />

      <Route path="preview" element={<Navigate to="../edit" />} />
    </Routes>
  );
};
