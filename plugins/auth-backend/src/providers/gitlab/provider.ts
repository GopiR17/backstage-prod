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

import express from 'express';
import { Strategy as GitlabStrategy } from 'passport-gitlab2';
import { Logger } from 'winston';

import {
  executeRedirectStrategy,
  executeFrameHandlerStrategy,
  executeRefreshTokenStrategy,
  executeFetchUserProfileStrategy,
  makeProfileInfo,
  PassportDoneCallback,
} from '../../lib/passport';
import {
  RedirectInfo,
  AuthProviderFactory,
  SignInResolver,
  AuthHandler,
  ProfileInfo,
} from '../types';
import {
  OAuthAdapter,
  OAuthProviderOptions,
  OAuthHandlers,
  OAuthResponse,
  OAuthEnvironmentHandler,
  OAuthStartRequest,
  OAuthRefreshRequest,
  encodeState,
  OAuthResult,
} from '../../lib/oauth';
import { TokenIssuer } from '../../identity';
import { CatalogIdentityClient } from '../../lib/catalog';

type FullProfile = OAuthResult['fullProfile'] & {
  avatarUrl?: string;
};

type PrivateInfo = {
  refreshToken: string;
};

export type GitlabAuthProviderOptions = OAuthProviderOptions & {
  baseUrl: string;
  signInResolver?: SignInResolver<OAuthResult>;
  authHandler?: AuthHandler<OAuthResult>;
  tokenIssuer: TokenIssuer;
  catalogIdentityClient: CatalogIdentityClient;
  logger: Logger;
};

export const extractGitLabUserId = (profile: ProfileInfo): string => {
  return profile.username || (profile.email?.split('@')[0] as string);
};

export const gitlabDefaultSignInResolver: SignInResolver<OAuthResult> = async (
  info,
  ctx,
) => {
  const { profile } = info;

  if (!profile.username && !profile.email) {
    throw new Error('Profile contained no username or email');
  }

  const id = extractGitLabUserId(profile);

  const token = await ctx.tokenIssuer.issueToken({
    claims: { sub: id, ent: [`user:default/${id}`] },
  });

  return { id, token };
};

export const gitlabDefaultAuthHandler: AuthHandler<OAuthResult> = async ({
  fullProfile,
  params,
}) => ({
  profile: makeProfileInfo(fullProfile, params.id_token),
});

export class GitlabAuthProvider implements OAuthHandlers {
  private readonly _strategy: GitlabStrategy;
  private readonly signInResolver?: SignInResolver<OAuthResult>;
  private readonly authHandler: AuthHandler<OAuthResult>;
  private readonly tokenIssuer: TokenIssuer;
  private readonly catalogIdentityClient: CatalogIdentityClient;
  private readonly logger: Logger;

  constructor(options: GitlabAuthProviderOptions) {
    this.catalogIdentityClient = options.catalogIdentityClient;
    this.logger = options.logger;
    this.tokenIssuer = options.tokenIssuer;
    this.authHandler = options.authHandler || gitlabDefaultAuthHandler;
    this.signInResolver = this.createSignInResolverFn(options);

    this._strategy = new GitlabStrategy(
      {
        clientID: options.clientId,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackUrl,
        baseURL: options.baseUrl,
      },
      (
        accessToken: any,
        refreshToken: any,
        params: any,
        fullProfile: any,
        done: PassportDoneCallback<OAuthResult, PrivateInfo>,
      ) => {
        done(
          undefined,
          { fullProfile, params, accessToken },
          {
            refreshToken,
          },
        );
      },
    );
  }

  async start(req: OAuthStartRequest): Promise<RedirectInfo> {
    return await executeRedirectStrategy(req, this._strategy, {
      scope: req.scope,
      state: encodeState(req.state),
    });
  }

  async handler(
    req: express.Request,
  ): Promise<{ response: OAuthResponse; refreshToken: string }> {
    const { result, privateInfo } = await executeFrameHandlerStrategy<
      OAuthResult,
      PrivateInfo
    >(req, this._strategy);

    return {
      response: await this.handleResult(result),
      refreshToken: privateInfo.refreshToken,
    };
  }

  async refresh(req: OAuthRefreshRequest): Promise<OAuthResponse> {
    const {
      accessToken,
      refreshToken: newRefreshToken,
      params,
    } = await executeRefreshTokenStrategy(
      this._strategy,
      req.refreshToken,
      req.scope,
    );

    const fullProfile = await executeFetchUserProfileStrategy(
      this._strategy,
      accessToken,
    );

    return this.handleResult({
      fullProfile,
      params,
      accessToken,
      refreshToken: newRefreshToken,
    });
  }

  private async handleResult(result: OAuthResult): Promise<OAuthResponse> {
    const transformedResult = this.transformResult(result);
    const { profile } = await this.authHandler(transformedResult);

    const response: OAuthResponse = {
      providerInfo: {
        idToken: result.params.id_token,
        accessToken: result.accessToken,
        scope: result.params.scope,
        expiresInSeconds: result.params.expires_in,
      },
      profile,
    };

    if (this.signInResolver) {
      response.backstageIdentity = await this.signInResolver(
        {
          result,
          profile,
        },
        {
          tokenIssuer: this.tokenIssuer,
          catalogIdentityClient: this.catalogIdentityClient,
          logger: this.logger,
        },
      );
    }

    return response;
  }

  private createSignInResolverFn({
    signInResolver,
    catalogIdentityClient,
    tokenIssuer,
    logger,
  }: GitlabAuthProviderOptions): SignInResolver<OAuthResult> {
    const resolver = signInResolver || gitlabDefaultSignInResolver;

    return info =>
      resolver(info, {
        catalogIdentityClient,
        tokenIssuer,
        logger,
      });
  }

  private transformResult(result: OAuthResult): OAuthResult {
    const { fullProfile, ...authResult } = result;

    fullProfile.photos = [
      ...(fullProfile.photos ?? []),
      ...((fullProfile as FullProfile).avatarUrl
        ? [{ value: (fullProfile as FullProfile).avatarUrl as string }]
        : []),
    ];

    const profile = makeProfileInfo(fullProfile);

    if (!profile.username && !profile.email) {
      throw new Error('Profile contained no username or email');
    }

    fullProfile.id = extractGitLabUserId(profile);

    return {
      ...authResult,
      fullProfile,
    };
  }
}

export type GitlabProviderOptions = {
  /**
   * The profile transformation function used to verify and convert the auth response
   * into the profile that will be presented to the user.
   */
  authHandler?: AuthHandler<OAuthResult>;

  /**
   * Configure sign-in for this provider, without it the provider can not be used to sign users in.
   */
  /**
   * Maps an auth result to a Backstage identity for the user.
   *
   * Set to `'email'` to use the default email-based sign in resolver, which will search
   * the catalog for a single user entity that has a matching `microsoft.com/email` annotation.
   */
  signIn?: {
    resolver?: SignInResolver<OAuthResult>;
  };
};

export const createGitlabProvider = (
  options?: GitlabProviderOptions,
): AuthProviderFactory => {
  return ({
    providerId,
    globalConfig,
    config,
    tokenIssuer,
    catalogApi,
    logger,
  }) =>
    OAuthEnvironmentHandler.mapConfig(config, envConfig => {
      const clientId = envConfig.getString('clientId');
      const clientSecret = envConfig.getString('clientSecret');
      const audience = envConfig.getOptionalString('audience');
      const baseUrl = audience || 'https://gitlab.com';
      const callbackUrl = `${globalConfig.baseUrl}/${providerId}/handler/frame`;

      const catalogIdentityClient = new CatalogIdentityClient({
        catalogApi,
        tokenIssuer,
      });

      const provider = new GitlabAuthProvider({
        clientId,
        clientSecret,
        callbackUrl,
        baseUrl,
        authHandler: options?.authHandler,
        signInResolver: options?.signIn?.resolver,
        catalogIdentityClient,
        logger,
        tokenIssuer,
      });

      return OAuthAdapter.fromConfig(globalConfig, provider, {
        disableRefresh: false,
        providerId,
        tokenIssuer,
      });
    });
};
