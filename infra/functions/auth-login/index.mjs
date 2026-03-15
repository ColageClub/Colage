import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

export const handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return response(400, { error: 'Email required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Set a deterministic password based on email (user never sees it — passwordless flow)
    // The real auth factor is the email OTP verification
    const password = `Colage!${Buffer.from(normalizedEmail).toString('base64').slice(0, 20)}1`;

    // Set the password (works for confirmed users)
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: normalizedEmail,
      Password: password,
      Permanent: true,
    }));

    // Authenticate to get tokens
    const auth = await cognito.send(new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: normalizedEmail,
        PASSWORD: password,
      },
    }));

    if (!auth.AuthenticationResult) {
      return response(401, { error: 'Authentication failed' });
    }

    return response(200, {
      accessToken: auth.AuthenticationResult.AccessToken,
      idToken: auth.AuthenticationResult.IdToken,
      refreshToken: auth.AuthenticationResult.RefreshToken,
      expiresIn: auth.AuthenticationResult.ExpiresIn,
    });
  } catch (err) {
    console.error('auth-login error:', err);
    if (err.name === 'UserNotFoundException') {
      return response(404, { error: 'User not found' });
    }
    return response(500, { error: 'Login failed' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
