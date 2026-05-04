import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from '../../config/ENV.js';

const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

export const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'fileName and fileType are required' });
    }

    // Generate unique file name to prevent overwrites
    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    const command = new PutObjectCommand({
      Bucket: ENV.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // The URL expires in 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Public URL format using CloudFront CDN
    const publicUrl = `https://media.trip2honeymoon.com/${key}`;

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return res.status(500).json({ success: false, msg: error.message || 'Server Error' });
  }
};

export const getPresignedViewUrl = async (key) => {
  if (!key) return null;
  // If it's a full URL (legacy test data, cloudinary, etc.), just return it
  if (key.startsWith('http')) return key;

  // View: User → CloudFront CDN
  return `https://media.trip2honeymoon.com/${key}`;
};

/**
 * Extract raw S3 Key from a full URL (presigned or public)
 * Helps avoid saving full presigned URLs (with tokens) into the database during updates.
 */
export const extractS3Key = (urlOrKey) => {
  if (!urlOrKey || typeof urlOrKey !== 'string') return urlOrKey;
  if (!urlOrKey.startsWith('http')) return urlOrKey; // Already a key

  try {
    const url = new URL(urlOrKey);
    let key = decodeURIComponent(url.pathname);
    if (key.startsWith('/')) key = key.substring(1);

    // If bucket name is at the start of the path (Path-style URL), remove it
    const bucketName = ENV.AWS_S3_BUCKET_NAME;
    if (key.startsWith(`${bucketName}/`)) {
      key = key.substring(bucketName.length + 1);
    }

    return key;
  } catch (err) {
    return urlOrKey;
  }
};
