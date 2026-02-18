import { HttpParams } from '@angular/common/http';

/**
 * Build HttpParams from an object, skipping null/undefined/empty string values.
 * All values are converted to strings automatically.
 */
export function buildHttpParams(
  obj: Record<string, string | number | boolean | null | undefined>
): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
