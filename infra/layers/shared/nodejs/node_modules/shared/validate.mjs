/**
 * Shared input validation + rate limiting helpers for Colage Lambdas.
 *
 * Rate limiting uses DynamoDB with TTL — no Redis needed at this scale.
 * Import: import { validate, rateLimit, response, parseBody } from '../shared/validate.mjs';
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const RATE_TABLE = process.env.RATE_LIMIT_TABLE || 'colage-rate-limits-dev';

// ─── Response helper ─────────────────────────────────────────
export function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
    body: JSON.stringify(body),
  };
}

// ─── Parse & validate JSON body ──────────────────────────────
export function parseBody(event) {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

// ─── String sanitization ─────────────────────────────────────
export function sanitize(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Strip basic HTML injection chars
}

// ─── Email validation ────────────────────────────────────────
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) && clean.length <= 254;
}

export function isValidEduEmail(email) {
  return isValidEmail(email) && email.trim().toLowerCase().endsWith('.edu');
}

// ─── Coordinate validation ───────────────────────────────────
export function isValidCoordinate(lat, lng) {
  const la = parseFloat(lat);
  const lo = parseFloat(lng);
  return !isNaN(la) && !isNaN(lo) &&
    la >= -90 && la <= 90 &&
    lo >= -180 && lo <= 180;
}

// ─── Phone validation ────────────────────────────────────────
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// ─── OTP code validation ─────────────────────────────────────
export function isValidOTP(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code.trim());
}

// ─── Rate limiting (DynamoDB-backed) ─────────────────────────
// key: unique identifier (e.g. IP, email, userId)
// limit: max requests per window
// windowSeconds: time window
export async function rateLimit(key, limit = 10, windowSeconds = 60) {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

  try {
    const result = await ddb.send(new UpdateCommand({
      TableName: RATE_TABLE,
      Key: { pk: windowKey },
      UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :one, #ttl = :ttl',
      ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1,
        ':ttl': now + windowSeconds + 10, // TTL with buffer
      },
      ReturnValues: 'ALL_NEW',
    }));

    const count = result.Attributes?.count || 0;
    return { allowed: count <= limit, count, limit };
  } catch (err) {
    // If rate limit table doesn't exist yet, allow through (fail open)
    console.warn('Rate limit check failed (allowing through):', err.message);
    return { allowed: true, count: 0, limit };
  }
}

// ─── Get client IP from API Gateway event ────────────────────
export function getClientIP(event) {
  return event.requestContext?.http?.sourceIp ||
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown';
}

// ─── Validate required fields ────────────────────────────────
export function validate(body, requiredFields) {
  if (!body) return 'Request body is required';
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `${field} is required`;
    }
  }
  return null; // valid
}
