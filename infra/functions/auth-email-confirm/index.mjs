import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { response, parseBody, isValidEduEmail, isValidOTP, sanitize, rateLimit, getClientIP } from './shared/validate.mjs';

const cognito = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

export const handler = async (event) => {
  try {
    // Rate limit: 10 attempts per minute per IP (code guessing prevention)
    const ip = getClientIP(event);
    const rl = await rateLimit(`email-confirm:${ip}`, 10, 60);
    if (!rl.allowed) {
      return response(429, { error: 'Too many attempts. Try again in a minute.' });
    }

    const body = parseBody(event);
    if (!body) return response(400, { error: 'Request body required' });

    const email = sanitize(body.email, 254).toLowerCase();
    const code = sanitize(body.code, 6);

    if (!isValidEduEmail(email)) {
      return response(400, { error: 'Valid .edu email required' });
    }
    if (!isValidOTP(code)) {
      return response(400, { error: 'Invalid verification code format' });
    }

    // Per-email rate limit: 5 attempts per 5 minutes
    const emailRL = await rateLimit(`email-confirm:${email}`, 5, 300);
    if (!emailRL.allowed) {
      return response(429, { error: 'Too many attempts for this email. Wait a few minutes.' });
    }

    await cognito.send(new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    }));

    // Extract root .edu domain (collapse subdomains)
    const fullDomain = email.split('@')[1];
    const parts = fullDomain.split('.');
    const domain = parts.slice(-2).join('.');

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
