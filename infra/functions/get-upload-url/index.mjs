import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { response } from './shared/validate.mjs';

const s3 = new S3Client({});
const BUCKET = process.env.PROFILE_PHOTOS_BUCKET;

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const handler = async (event) => {
  try {
    const { userId, contentType, fileSize } = JSON.parse(event.body);

    if (!userId) return response(400, { error: 'userId required' });

    if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return response(400, { error: `Invalid contentType. Must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}` });
    }

    if (fileSize != null) {
      if (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
        return response(400, { error: `Invalid fileSize. Must be between 1 and ${MAX_FILE_SIZE} bytes (10MB)` });
      }
    }

    const key = `photos/${userId}/${randomUUID()}.${EXT_MAP[contentType]}`;

    const commandParams = {
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: { userId },
    };

    // Bind presigned URL to exact file size if provided
    if (fileSize) {
      commandParams.ContentLength = fileSize;
    }

    const command = new PutObjectCommand(commandParams);

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

    return response(200, {
      uploadUrl,
      key,
      publicUrl: `https://${process.env.PHOTOS_CDN_DOMAIN || BUCKET}/${key}`,
    });
  } catch (err) {
    console.error('get-upload-url error:', err);
    return response(500, { error: 'Failed to generate upload URL' });
  }
};
