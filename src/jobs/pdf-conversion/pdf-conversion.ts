import got, { HTTPError, RequestError } from "got";
import { ConvertResponse } from "./pdf-conversion.interface";
import FormData from "form-data";
import { secret } from "encore.dev/config";

const sharpApisApplicationId = secret("SHARPAPIS_APPLICATION_ID");
const sharpApisSecretKey = secret("SHARPAPIS_SECRET_KEY");

export const generatePDFDownloadURL = async ({
  buffer,
  filename,
  contentType,
}: {
  buffer: Buffer;
  filename: string;
  contentType: string;
}): Promise<string> => {
  const form = new FormData();
  form.append("inputFile", buffer, {
    filename,
    contentType,
  });
  form.append("outputFormat", "pdf");
  form.append("async", "false");

  const url = "https://api2.docconversionapi.com/jobs/create";

  const options = {
    headers: {
      ...form.getHeaders(),
      "X-ApplicationID": sharpApisApplicationId(),
      "X-SecretKey": sharpApisSecretKey(),
    },
    body: form,
    timeout: {
      request: 10_000,
    },
    retry: {
      limit: 3,
      errorCodes: ["2000", "2001", "2002"],
    },
  };

  try {
    const res = await got.post(url, options).json<ConvertResponse>();
    return res.fileDownloadUrl;
  } catch (error) {
    if (error instanceof HTTPError) {
      const statusCode = error.response.statusCode;
      const body = error.response.body;

      throw new Error(`HTTP ${statusCode}: ${body}`);
    }

    if (error instanceof RequestError) {
      throw new Error(`Request failed: ${error.message}`);
    }

    throw error;
  }
};

export const downloadPDFUrl = async (url: string): Promise<Buffer> => {
  const options = {
    responseType: "buffer",
    timeout: {
      lookup: 5_000,
      connect: 5_000,
      secureConnect: 5_000,
      socket: 120_000,
    },
    retry: {
      limit: 1,
    },
  };

  try {
    const res = await got.get(url, options);
    return res.rawBody;
  } catch (error) {
    if (error instanceof HTTPError) {
      const statusCode = error.response.statusCode;
      const body = error.response.body;

      throw new Error(`HTTP ${statusCode}: ${body}`);
    }

    if (error instanceof RequestError) {
      throw new Error(`Request failed: ${error.message}`);
    }

    throw error;
  }
};
