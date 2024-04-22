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
import { EventParams, EventSubscriber } from '@backstage/plugin-events-node';
import { getMatchingEntities, triggerTechDocsRefresh } from '../utils';

import { AZURE_DEVOPS_TOPIC_REPO_PUSH } from '../constants';
import { CatalogApi } from '@backstage/catalog-client';
import { CodePushEvent } from './types';
import { Config } from '@backstage/config';
import { Logger } from 'winston';
import { TokenManager } from '@backstage/backend-common';
import { assertError } from '@backstage/errors';
import { stringifyEntityRef } from '@backstage/catalog-model';

/** @public */
export class AzureDevOpsTechDocsEventSubscriber implements EventSubscriber {
  private readonly config: Config;
  private readonly logger: Logger;
  private readonly tokenManager: TokenManager;
  private readonly catalogClient: CatalogApi;

  private constructor(
    config: Config,
    logger: Logger,
    tokenManager: TokenManager,
    catalogClient: CatalogApi,
  ) {
    this.config = config;
    this.logger = logger;
    this.tokenManager = tokenManager;
    this.catalogClient = catalogClient;
  }

  static fromConfig(
    config: Config,
    options: {
      logger: Logger;
      tokenManager: TokenManager;
      catalogClient: CatalogApi;
    },
  ): AzureDevOpsTechDocsEventSubscriber {
    const logger = options.logger.child({
      class: AzureDevOpsTechDocsEventSubscriber.prototype.constructor.name,
    });
    return new AzureDevOpsTechDocsEventSubscriber(
      config,
      logger,
      options.tokenManager,
      options.catalogClient,
    );
  }

  supportsEventTopics(): string[] {
    return [AZURE_DEVOPS_TOPIC_REPO_PUSH];
  }

  async onEvent(params: EventParams): Promise<void> {
    this.logger.info(`Received event from ${params.topic}`);
    if (params.topic !== AZURE_DEVOPS_TOPIC_REPO_PUSH) {
      this.logger.warn(`Does not support ${params.topic} event topic`);
      return;
    }

    try {
      await this.onRepoPush(params.eventPayload as CodePushEvent);
    } catch (error) {
      assertError(error);
      this.logger.error(
        `Unable to handle ${AZURE_DEVOPS_TOPIC_REPO_PUSH}: ${error.message}. Details: ${error.stack}`,
      );
    }
  }

  private async onRepoPush(event: CodePushEvent) {
    const repoName = event.resource.repository.name;
    const projectName = event.resource.repository.project.name;
    this.logger.info(
      `Handle ${AZURE_DEVOPS_TOPIC_REPO_PUSH} event for ${projectName} - ${repoName}`,
    );
    const entities = await getMatchingEntities(
      this.tokenManager,
      this.catalogClient,
      this.logger,
      projectName,
      repoName,
    );

    for (const entity of entities) {
      const entityRef = stringifyEntityRef(entity);
      triggerTechDocsRefresh(
        this.config.getString('backend.baseUrl'),
        entity,
        this.tokenManager,
      );
      this.logger.info(
        `Triggered TechDocs refresh of ${entityRef} for ${projectName} - ${repoName}`,
      );
    }

    this.logger.info(
      `Processed ${AZURE_DEVOPS_TOPIC_REPO_PUSH} event for ${projectName} - ${repoName}`,
    );
  }
}
