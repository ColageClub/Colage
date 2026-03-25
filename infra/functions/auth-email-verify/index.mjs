import { CognitoIdentityProviderClient, SignUpCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { response, parseBody, isValidEduEmail, sanitize, rateLimit, getClientIP } from './shared/validate.mjs';

const cognito = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

export const handler = async (event) => {
  try {
    // Rate limit: 5 attempts per minute per IP
    const ip = getClientIP(event);
    const rl = await rateLimit(`email-verify:${ip}`, 5, 60);
    if (!rl.allowed) {
      return response(429, { error: 'Too many requests. Try again in a minute.' });
    }

    const body = parseBody(event);
    if (!body?.email) {
      return response(400, { error: 'Email is required' });
    }

    const email = sanitize(body.email, 254).toLowerCase();
    if (!isValidEduEmail(email)) {
      return response(400, { error: 'Valid .edu email required' });
    }

    // Also rate limit per email: 3 attempts per 5 minutes
    const emailRL = await rateLimit(`email-verify:${email}`, 3, 300);
    if (!emailRL.allowed) {
      return response(429, { error: 'Verification code already sent. Check your email or try again in a few minutes.' });
    }

    // Check if user already exists
    try {
      await cognito.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      }));
      return response(200, { message: 'Verification code sent', existing: true });
    } catch (e) {
      if (e.name !== 'UserNotFoundException') throw e;
    }

    // Sign up with temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(2)}!1`;
    await cognito.send(new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: tempPassword,
      UserAttributes: [
        { Name: 'email', Value: email },
      ],
    }));

    return response(200, { message: 'Verification code sent' });
  } catch (err) {
    console.error('auth-email-verify error:', err);
    return response(500, { error: 'Failed to send verification' });
  }
};
