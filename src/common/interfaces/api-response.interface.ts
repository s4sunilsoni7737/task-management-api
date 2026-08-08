/**
 * Standard response envelope returned by every controller method in this
 * API — no exceptions. Errors are thrown as NestJS HTTP exceptions, never
 * returned as `success: false` inside a 200 response.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  userMessage: string;
  developerMessage: string;
  data: T;
}

export interface PaginatedResult<T = any> {
  list: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
