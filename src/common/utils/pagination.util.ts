import { PaginatedResult } from '../interfaces/api-response.interface';

/**
 * ✅ PATTERN: Paginate only if BOTH page AND limit are provided by the
 * caller. Otherwise return the full filtered set (still capped by the
 * caller's query, just not skip/limit-ed).
 */
export function buildPagination(page?: number, limit?: number) {
  const shouldPaginate = Boolean(page) && Boolean(limit);
  const skip = shouldPaginate ? (Number(page) - 1) * Number(limit) : 0;
  return { shouldPaginate, skip, page: Number(page) || 1, limit: Number(limit) || 0 };
}

export function toPaginatedResult<T>(
  list: T[],
  total: number,
  shouldPaginate: boolean,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    list,
    total,
    page: shouldPaginate ? page : 1,
    limit: shouldPaginate ? limit : total,
    totalPages: shouldPaginate ? Math.max(1, Math.ceil(total / limit)) : 1,
  };
}
