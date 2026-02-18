export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Kiterjesztett pagináció response (from/to mezőkkel)
 * Laravel paginator válasz formátum.
 */
export interface ExtendedPaginatedResponse<T> extends PaginatedResponse<T> {
  from: number | null;
  to: number | null;
}
