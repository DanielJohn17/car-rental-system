import { LimitOffsetPaginationDto } from './limit-offset-pagination.dto';

type NormalizeLimitOffsetOptions = {
  readonly defaultLimit: number;
  readonly maxLimit: number;
};

const DEFAULT_OPTIONS: NormalizeLimitOffsetOptions = {
  defaultLimit: 20,
  maxLimit: 100,
};

export function normalizeLimitOffsetPagination(
  pagination: LimitOffsetPaginationDto,
  options: NormalizeLimitOffsetOptions = DEFAULT_OPTIONS,
): { limit: number; offset: number } {
  const rawLimit: number = pagination.limit ?? options.defaultLimit;
  const rawOffset: number = pagination.offset ?? 0;
  const limit: number = Math.min(Math.max(1, rawLimit), options.maxLimit);
  const offset: number = Math.max(0, rawOffset);
  return { limit, offset };
}
