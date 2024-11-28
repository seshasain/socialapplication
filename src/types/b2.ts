export interface B2AuthResponse {
    absoluteMinimumPartSize: number;
    accountId: string;
    allowed: {
      bucketId: string;
      bucketName: string;
      capabilities: string[];
      namePrefix: string;
    };
    apiUrl: string;
    authorizationToken: string;
    downloadUrl: string;
    recommendedPartSize: number;
    s3ApiUrl: string;
  }
  
  export interface B2UploadUrlResponse {
    uploadUrl: string;
    authorizationToken: string;
    bucketId: string;
  }
  
  export interface B2FileResponse {
    accountId: string;
    action: string;
    bucketId: string;
    contentLength: number;
    contentSha1: string;
    contentType: string;
    fileId: string;
    fileName: string;
    uploadTimestamp: number;
  }
  
  export interface B2ListFilesResponse {
    files: B2FileResponse[];
    nextFileName: string | null;
  }