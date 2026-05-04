import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { ENV } from './src/config/ENV.js';

const client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  try {
    const command = new GetBucketCorsCommand({ Bucket: ENV.AWS_S3_BUCKET_NAME });
    const response = await client.send(command);
    console.log("CORS Configuration:");
    console.log(JSON.stringify(response.CORSRules, null, 2));
  } catch (error) {
    console.error("Error fetching CORS:", error.message);
  }
}
main();
