export type LimitOffsetPaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
};
