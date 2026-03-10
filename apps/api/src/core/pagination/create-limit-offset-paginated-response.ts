import { createPaginationMeta } from './create-pagination-meta';
import type { LimitOffsetPaginatedResponse } from './limit-offset-paginated-response.type';

export function createLimitOffsetPaginatedResponse<T>(params: {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}): LimitOffsetPaginatedResponse<T> {
  const meta = createPaginationMeta(params.total, params.limit, params.offset);
  return {
    data: params.data,
    total: meta.total,
    limit: meta.limit,
    offset: meta.offset,
    page: meta.page,
    totalPages: meta.totalPages,
  };
}
