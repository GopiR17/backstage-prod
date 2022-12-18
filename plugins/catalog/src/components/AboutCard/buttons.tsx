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

import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_LOCATION,
  DEFAULT_NAMESPACE,
  getEntitySourceLocation,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { IconLinkVertical, Link } from '@backstage/core-components';
import {
  alertApiRef,
  errorApiRef,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
import { ScmIntegrationIcon } from '@backstage/integration-react';
import { useEntity, catalogApiRef } from '@backstage/plugin-catalog-react';

import { IconButton } from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import DocsIcon from '@material-ui/icons/Description';
import EditIcon from '@material-ui/icons/Edit';
import React, { useCallback } from 'react';
import { viewTechDocRouteRef } from '../../routes';

export function RefreshButton() {
  const { entity } = useEntity();
  const catalogApi = useApi(catalogApiRef);
  const alertApi = useApi(alertApiRef);
  const errorApi = useApi(errorApiRef);

  const entityLocation = entity.metadata.annotations?.[ANNOTATION_LOCATION];
  // Limiting the ability to manually refresh to the less expensive locations
  const allowRefresh =
    entityLocation?.startsWith('url:') || entityLocation?.startsWith('file:');
  const refreshEntity = useCallback(async () => {
    try {
      await catalogApi.refreshEntity(stringifyEntityRef(entity));
      alertApi.post({ message: 'Refresh scheduled', severity: 'info' });
    } catch (e) {
      errorApi.post(e);
    }
  }, [catalogApi, alertApi, errorApi, entity]);

  return (
    <>
      {allowRefresh && (
        <IconButton
          aria-label="Refresh"
          title="Schedule entity refresh"
          onClick={refreshEntity}
        >
          <CachedIcon />
        </IconButton>
      )}
    </>
  );
}

export function EditMetadataButton() {
  const { entity } = useEntity();

  const entityMetadataEditUrl =
    entity.metadata.annotations?.[ANNOTATION_EDIT_URL];

  return (
    <IconButton
      component={Link}
      aria-label="Edit"
      disabled={!entityMetadataEditUrl}
      title="Edit Metadata"
      to={entityMetadataEditUrl ?? '#'}
    >
      <EditIcon />
    </IconButton>
  );
}

export function ViewInSourceButton() {
  const { entity } = useEntity();

  let entitySourceLocation:
    | {
        type: string;
        target: string;
      }
    | undefined;

  try {
    entitySourceLocation = getEntitySourceLocation(entity);
  } catch (e) {
    // do not throw
  }

  return (
    <IconLinkVertical
      label="View Source"
      disabled={!entitySourceLocation}
      icon={<ScmIntegrationIcon type={entitySourceLocation?.type} />}
      href={entitySourceLocation?.target}
    />
  );
}

export function ViewInTechDocsButton() {
  const { entity } = useEntity();
  const viewTechdocLink = useRouteRef(viewTechDocRouteRef);

  return (
    <IconLinkVertical
      label="View TechDocs"
      disabled={
        !entity.metadata.annotations?.['backstage.io/techdocs-ref'] ||
        !viewTechdocLink
      }
      icon={<DocsIcon />}
      href={
        viewTechdocLink &&
        viewTechdocLink({
          namespace: entity.metadata.namespace || DEFAULT_NAMESPACE,
          kind: entity.kind,
          name: entity.metadata.name,
        })
      }
    />
  );
}
