import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const MAX_LIMIT = 100;

export class CursorPaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}
