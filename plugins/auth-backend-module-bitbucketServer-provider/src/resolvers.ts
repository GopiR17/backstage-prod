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

import {
  createSignInResolverFactory,
  OAuthAuthenticatorResult,
  PassportProfile,
  SignInInfo,
} from '@backstage/plugin-auth-node';

/**
 * Available sign-in resolvers for the BitbucketServer auth provider.
 *
 * @public
 */
export namespace bitbucketServerSignInResolvers {
  /**
   * Looks up the user by matching their Bitbucket email with the `bitbucket.org/email` annotation.
   */
  export const emailMatchingUserEntityProfileEmail =
    createSignInResolverFactory({
      create() {
        return async (
          info: SignInInfo<OAuthAuthenticatorResult<PassportProfile>>,
          ctx,
        ) => {
          const { profile } = info;

          if (!profile.email) {
            throw new Error('BitbucketServer profile contained no email');
          }

          return ctx.signInWithCatalogUser({
            annotations: {
              'bitbucket.org/email': profile.email,
            },
          });
        };
      },
    });
}
