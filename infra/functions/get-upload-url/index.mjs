import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});
const BUCKET = process.env.PROFILE_PHOTOS_BUCKET;

export const handler = async (event) => {
  try {
    const { userId, contentType } = JSON.parse(event.body);

    if (!userId) return response(400, { error: 'userId required' });

    const key = `photos/${userId}/${randomUUID()}.${contentType === 'image/png' ? 'png' : 'jpg'}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || 'image/jpeg',
      Metadata: { userId },
    });

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

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
