export interface ApiSuccess<T> {
  data: T;
  meta: { version: string; lastModifiedAt: string };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    operationId?: string;
    fieldErrors?: Record<string, string[]>;
  };
}
