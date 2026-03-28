import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'node:crypto';
import { response, parseBody, rateLimit, getClientIP } from './shared/validate.mjs';

const cognito = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID;
const USERS_TABLE = process.env.USERS_TABLE;

export const handler = async (event) => {
  try {
    // Rate limit: 5/min per IP
    const ip = getClientIP(event);
    const ipRL = await rateLimit(`auth-login:${ip}`, 5, 60);
    if (!ipRL.allowed) {
      return response(429, { error: 'Too many login attempts. Try again in a minute.' });
    }

    const body = parseBody(event);
    if (!body) return response(400, { error: 'Request body is required' });

    const { email, deviceId } = body;

    if (!email || !email.includes('@')) {
      return response(400, { error: 'Email required' });
    }

    if (!deviceId) {
      return response(400, { error: 'Device ID required' });
    }

    const normalizedEmail = email.toLowerCase();

    // Rate limit: 3/min per email
    const emailRL = await rateLimit(`auth-login:${normalizedEmail}`, 3, 60);
    if (!emailRL.allowed) {
      return response(429, { error: 'Too many login attempts for this email. Try again in a minute.' });
    }

    // Generate a random password each login (not deterministic)
    const password = crypto.randomBytes(32).toString('base64url');

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

    // Store device ID for single-device enforcement
    // Fix: query by-email GSI to get userId (table PK), then update with correct key
    try {
      const lookup = await docClient.send(new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'by-email',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': normalizedEmail },
      }));

      if (lookup.Items?.length) {
        await docClient.send(new UpdateCommand({
          TableName: USERS_TABLE,
          Key: { userId: lookup.Items[0].userId },
          UpdateExpression: 'SET deviceId = :deviceId, updatedAt = :timestamp',
          ExpressionAttributeValues: {
            ':deviceId': deviceId,
            ':timestamp': new Date().toISOString(),
          },
          ReturnValues: 'NONE',
        }));
      }
    } catch (dbError) {
      console.warn('Failed to store device ID:', dbError);
      // Continue even if device ID storage fails
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
