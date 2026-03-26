import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { response, parseBody, isValidEduEmail, isValidOTP, sanitize, rateLimit, getClientIP } from './shared/validate.mjs';

const cognito = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.USER_POOL_ID;
const OTP_TABLE = process.env.OTP_TABLE_NAME || 'colage-otp-dev';

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

    // Look up OTP from our table
    const otpRecord = await docClient.send(new GetCommand({
      TableName: OTP_TABLE,
      Key: { email },
    }));

    if (!otpRecord.Item) {
      return response(400, { error: 'No verification code found. Request a new one.' });
    }

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (otpRecord.Item.ttl < now) {
      // Clean up expired OTP
      await docClient.send(new DeleteCommand({ TableName: OTP_TABLE, Key: { email } }));
      return response(400, { error: 'Code expired. Request a new one.' });
    }

    // Check code
    if (otpRecord.Item.otp !== code) {
      return response(400, { error: 'Invalid verification code' });
    }

    // OTP valid — confirm the Cognito user
    try {
      await cognito.send(new AdminConfirmSignUpCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      }));
    } catch (e) {
      // NotAuthorizedException means already confirmed — that's fine
      if (e.name !== 'NotAuthorizedException') {
        console.warn('Cognito confirm warning:', e.name, e.message);
      }
    }

    // Clean up OTP
    await docClient.send(new DeleteCommand({ TableName: OTP_TABLE, Key: { email } }));

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
    return response(500, { error: 'Verification failed' });
  }
};
