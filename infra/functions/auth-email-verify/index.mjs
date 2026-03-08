import { CognitoIdentityProviderClient, SignUpCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

export const handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@') || !email.toLowerCase().endsWith('.edu')) {
      return response(400, { error: 'Valid .edu email required' });
    }

    // Check if user already exists
    try {
      await cognito.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email.toLowerCase(),
      }));
      // User exists — trigger resend
      return response(200, { message: 'Verification code sent', existing: true });
    } catch (e) {
      if (e.name !== 'UserNotFoundException') throw e;
    }

    // Sign up with temporary password (will be replaced by custom auth)
    const tempPassword = `Temp${Math.random().toString(36).slice(2)}!1`;
    await cognito.send(new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email.toLowerCase(),
      Password: tempPassword,
      UserAttributes: [
        { Name: 'email', Value: email.toLowerCase() },
      ],
    }));

    return response(200, { message: 'Verification code sent' });
  } catch (err) {
    console.error('auth-email-verify error:', err);
    return response(500, { error: 'Failed to send verification' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
