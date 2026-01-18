import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

const bucketRegion = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucketRegion || !accessKeyId || !secretAccessKey) {
  throw new Error("Missing AWS environment variables");
}

export const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
