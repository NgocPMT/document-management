import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import DocumentRepository from "./documents.repo";
import { s3 } from "../../storage/s3.client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DocumentService = {
  upload: async ({
    filename,
    buf,
    mimeType,
    userId,
  }: {
    filename: string;
    buf: Buffer;
    mimeType: string;
    userId: string;
  }) => {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
      Body: buf,
      ContentType: mimeType,
    });
    await s3.send(command);

    await DocumentRepository.create({
      name: filename,
      userId: userId,
      status: "READY",
    });
  },
  generateSignedUrl: async (id: string) => {
    const key = await DocumentRepository.getObjectKey(id);

    if (!key) {
      return null;
    }
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 60,
    });

    return signedUrl;
  },
};

export default DocumentService;
