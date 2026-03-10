import { IsOptional, IsString } from 'class-validator';
import { LimitOffsetPaginationDto } from '../../../core/pagination/limit-offset-pagination.dto';

export class GetStaffMembersQueryDto extends LimitOffsetPaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
