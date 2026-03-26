import { CognitoIdentityProviderClient, SignUpCommand, AdminGetUserCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { response, parseBody, isValidEduEmail, sanitize, rateLimit, getClientIP } from './shared/validate.mjs';

const cognito = new CognitoIdentityProviderClient({});
const ses = new SESClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const OTP_TABLE = process.env.OTP_TABLE_NAME || 'colage-otp-dev';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Colage <admin@colageclub.com>';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Check if user already exists in Cognito
    let existing = false;
    let userStatus = null;
    try {
      const user = await cognito.send(new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
      }));
      existing = true;
      userStatus = user.UserStatus;
    } catch (e) {
      if (e.name !== 'UserNotFoundException') throw e;
    }

    // Generate our own OTP
    const otp = generateOTP();
    const ttl = Math.floor(Date.now() / 1000) + 600; // 10 min expiry

    // Store OTP in DynamoDB
    await docClient.send(new PutCommand({
      TableName: OTP_TABLE,
      Item: {
        email,
        otp,
        ttl,
        createdAt: new Date().toISOString(),
        existing,
      },
    }));

    // If new user, create in Cognito (but we'll confirm manually later)
    if (!existing) {
      const tempPassword = `Temp${Math.random().toString(36).slice(2)}!1`;
      try {
        await cognito.send(new SignUpCommand({
          ClientId: CLIENT_ID,
          Username: email,
          Password: tempPassword,
          UserAttributes: [
            { Name: 'email', Value: email },
          ],
        }));
      } catch (e) {
        // UsernameExistsException is OK — race condition
        if (e.name !== 'UsernameExistsException') throw e;
      }
    }

    // Send OTP via SES (reliable — we control it)
    await ses.send(new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Your Colage verification code' },
        Body: {
          Text: { Data: `Your Colage verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.` },
          Html: { Data: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981; margin-bottom: 8px;">Colage</h2>
              <p style="color: #666; margin-bottom: 24px;">Your verification code:</p>
              <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</span>
              </div>
              <p style="color: #999; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
          ` },
        },
      },
    }));

    return response(200, { message: 'Verification code sent', existing });
  } catch (err) {
    console.error('auth-email-verify error:', err);
    return response(500, { error: 'Failed to send verification' });
  }
};
