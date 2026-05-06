import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from '../../config/ENV.js';

/**
 * AWS S3 CONFIGURATION
 * Initialize the S3 client using credentials from environment variables.
 */
const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * GENERATE PRESIGNED UPLOAD URL
 * -----------------------------
 * This endpoint allows the frontend to upload files directly to S3.
 * 1. Generates a unique filename using Date.now().
 * 2. Creates an AWS PutObjectCommand.
 * 3. Returns a 'signedUrl' which the browser uses to perform a 'PUT' request.
 * 
 * @param {Object} req.body - Expected: { fileName, fileType, folder }
 */
export const generatePresignedUrl = async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: 'fileName and fileType are required' });
    }

    // Generate unique file name to prevent accidental overwrites
    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    const command = new PutObjectCommand({
      Bucket: ENV.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // The upload URL expires in 5 minutes for security
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // The public URL is constructed using the CloudFront CDN domain
    const publicUrl = `${ENV.AWS_CLOUDFRONT_URL}/${key}`;

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error('[S3_ERROR] Failed to generate pre-signed URL:', error);
    return res.status(500).json({ success: false, msg: error.message || 'Server Error' });
  }
};

/**
 * CONSTRUCT CDN VIEW URL
 * ----------------------
 * Converts a raw S3 Key (stored in DB) into a fully qualified CloudFront URL.
 * Note: CloudFront is used for global low-latency delivery.
 * 
 * @param {String} key - The raw S3 key (e.g., 'blogs/image.jpg')
 */
export const getPresignedViewUrl = async (key) => {
  if (!key) return null;
  
  // If the key is already a full URL (legacy data), return it as is
  if (key.startsWith('http')) return key;

  // Transform raw key to CloudFront delivery URL
  return `${ENV.AWS_CLOUDFRONT_URL}/${key}`;
};

/**
 * EXTRACT S3 KEY FROM URL
 * -----------------------
 * Reverses a full URL back into a raw S3 Key.
 * Crucial for database updates and deletions to ensure we don't save 
 * redundant domain names or expired tokens into the database.
 * 
 * @param {String} urlOrKey - Full URL or raw key
 */
export const extractS3Key = (urlOrKey) => {
  if (!urlOrKey || typeof urlOrKey !== 'string') return urlOrKey;
  if (!urlOrKey.startsWith('http')) return urlOrKey; 

  try {
    const url = new URL(urlOrKey);
    let key = decodeURIComponent(url.pathname);
    
    // Remove leading slash if present
    if (key.startsWith('/')) key = key.substring(1);

    // If bucket name is at the start of the path (S3 Path-style), strip it
    const bucketName = ENV.AWS_S3_BUCKET_NAME;
    if (key.startsWith(`${bucketName}/`)) {
      key = key.substring(bucketName.length + 1);
    }

    return key;
  } catch (err) {
    return urlOrKey;
  }
};
