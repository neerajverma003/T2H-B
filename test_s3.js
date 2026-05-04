import { getPresignedViewUrl } from './src/controller/admin/s3.controller.js';
import { ENV } from './src/config/ENV.js';

async function test() {
    console.log("Testing S3 with Bucket:", ENV.AWS_S3_BUCKET_NAME);
    const testKey = "destination/Domestic/Goa/1714574829342.jpg"; // Try a key that likely exists
    const url = await getPresignedViewUrl(testKey);
    console.log("Generated URL:", url);
}
test();
