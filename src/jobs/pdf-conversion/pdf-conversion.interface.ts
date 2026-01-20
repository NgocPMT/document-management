export interface ConvertResponse {
  id: number;
  fileName: string;
  fileId: string;
  userId: number;
  startedAt: string;
  finishedAt: string;
  outputFileName: string;
  outputFormat: string;
  conversionParametersApplied: string;
  creditCost: number;
  status: "Success" | "Failed";
  fileDownloadUrl: string;
  statusCode: number;
  errorMessage: string | null;
  userIpAddress: string;
}
