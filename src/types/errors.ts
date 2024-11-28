export class FileValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'FileValidationError';
    }
  }
  
  export class UploadError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'UploadError';
    }
  }
  
  export class NetworkError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NetworkError';
    }
  }