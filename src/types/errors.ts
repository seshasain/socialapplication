export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'API_ERROR'
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'UPLOAD_ERROR'
  | 'FILE_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'NOT_FOUND_ERROR';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorMetadata {
  code: ErrorCode;
  status?: number;
  field?: string;
  value?: any;
  retry?: boolean;
  severity?: ErrorSeverity;
  timestamp?: string;
}

export class BaseError extends Error {
  public metadata: ErrorMetadata;

  constructor(message: string, metadata: Partial<ErrorMetadata>) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = {
      code: 'API_ERROR',
      severity: 'error',
      retry: false,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      ...this.metadata
    };
  }
}

export class APIError extends BaseError {
  constructor(
    message: string,
    status?: number,
    code: ErrorCode = 'API_ERROR',
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code,
      status,
      retry: status ? status >= 500 : false,
      ...metadata
    });
  }
}

export class ValidationError extends BaseError {
  constructor(
    message: string,
    field?: string,
    value?: any,
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      field,
      value,
      severity: 'warning',
      retry: false,
      ...metadata
    });
  }
}

export class AuthenticationError extends BaseError {
  constructor(
    message: string = 'Authentication required',
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'AUTH_ERROR',
      status: 401,
      severity: 'error',
      retry: false,
      ...metadata
    });
  }
}

export class NetworkError extends BaseError {
  constructor(
    message: string = 'Network error occurred',
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'NETWORK_ERROR',
      severity: 'error',
      retry: true,
      ...metadata
    });
  }
}

export class MediaUploadError extends BaseError {
  constructor(
    message: string,
    file?: string,
    status?: number,
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'UPLOAD_ERROR',
      status,
      field: 'file',
      value: file,
      retry: true,
      ...metadata
    });
  }
}

export class FileValidationError extends BaseError {
  constructor(
    message: string,
    file?: string,
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'FILE_ERROR',
      field: 'file',
      value: file,
      severity: 'warning',
      retry: false,
      ...metadata
    });
  }
}

export class NotFoundError extends BaseError {
  constructor(
    message: string = 'Resource not found',
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'NOT_FOUND_ERROR',
      status: 404,
      severity: 'error',
      retry: false,
      ...metadata
    });
  }
}

export class RateLimitError extends BaseError {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    metadata: Partial<ErrorMetadata> = {}
  ) {
    super(message, {
      code: 'RATE_LIMIT_ERROR',
      status: 429,
      retry: true,
      value: retryAfter,
      ...metadata
    });
  }
}

export function isErrorType<T extends BaseError>(
  error: any,
  ErrorClass: new (...args: any[]) => T
): error is T {
  return error instanceof ErrorClass;
}

export function createError(error: any): BaseError {
  if (error instanceof BaseError) return error;
  
  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('fetch'))
      return new NetworkError(error.message);
    if (error.message.includes('auth') || error.message.includes('token'))
      return new AuthenticationError(error.message);
    if (error.message.includes('not found'))
      return new NotFoundError(error.message);
    return new APIError(error.message);
  }
  
  return new APIError('An unknown error occurred');
}