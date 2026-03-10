import { PaginationMetaDto } from './pagination-meta.dto';

export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number,
): PaginationMetaDto {
  const meta: PaginationMetaDto = {
    total,
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
  };
  return meta;
}
