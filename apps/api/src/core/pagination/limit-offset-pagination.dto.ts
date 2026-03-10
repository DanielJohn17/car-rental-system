import { IsInt, IsOptional, Max, Min } from 'class-validator';

const MAX_LIMIT = 100;

export class LimitOffsetPaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
