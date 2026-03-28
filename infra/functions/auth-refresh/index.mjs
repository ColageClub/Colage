import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { response, parseBody } from './shared/validate.mjs';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

export const handler = async (event) => {
  try {
    const body = parseBody(event);
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      return response(400, { error: 'refreshToken required' });
    }

    const auth = await cognito.send(new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    }));

    if (!auth.AuthenticationResult) {
      return response(401, { error: 'Refresh failed' });
    }

    return response(200, {
      accessToken: auth.AuthenticationResult.AccessToken,
      idToken: auth.AuthenticationResult.IdToken,
      expiresIn: auth.AuthenticationResult.ExpiresIn,
    });
  } catch (err) {
    console.error('auth-refresh error:', err);
    return response(401, { error: 'Token refresh failed' });
  }
};
