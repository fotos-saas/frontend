/**
 * HTTP hiba response típus
 * Angular HttpErrorResponse-ból származó hiba objektum
 */
export interface HttpError {
  status: number;
  statusText?: string;
  error?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
  message?: string;
}

/**
 * Type guard a HttpError ellenőrzésére
 */
export function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as HttpError).status === 'number'
  );
}
