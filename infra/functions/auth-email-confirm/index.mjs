import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

export const handler = async (event) => {
  try {
    const { email, code } = JSON.parse(event.body);

    if (!email || !code) {
      return response(400, { error: 'Email and code required' });
    }

    await cognito.send(new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email.toLowerCase(),
      ConfirmationCode: code,
    }));

    // Extract domain for university assignment
    const domain = email.toLowerCase().split('@')[1];

    return response(200, {
      message: 'Email verified',
      verified: true,
      universityDomain: domain,
    });
  } catch (err) {
    console.error('auth-email-confirm error:', err);
    if (err.name === 'CodeMismatchException') {
      return response(400, { error: 'Invalid verification code' });
    }
    if (err.name === 'ExpiredCodeException') {
      return response(400, { error: 'Code expired, request a new one' });
    }
    return response(500, { error: 'Verification failed' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
