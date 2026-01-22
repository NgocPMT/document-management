import { secret } from "encore.dev/config";
import { Service } from "encore.dev/service";

export const bucketName = secret("AWS_BUCKET_NAME");

export default new Service("workflows");
