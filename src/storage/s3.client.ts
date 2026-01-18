import { S3Client } from "@aws-sdk/client-s3";
import { secret } from "encore.dev/config";

const bucketRegion = secret("AWS_BUCKET_REGION");
const accessKeyId = secret("AWS_ACCESS_KEY_ID");
const secretAccessKey = secret("AWS_SECRET_ACCESS_KEY");

export const s3 = new S3Client({
  region: bucketRegion(),
  credentials: {
    accessKeyId: accessKeyId(),
    secretAccessKey: secretAccessKey(),
  },
});
