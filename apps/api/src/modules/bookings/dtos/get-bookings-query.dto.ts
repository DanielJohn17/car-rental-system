import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';
import { LimitOffsetPaginationDto } from '../../../core/pagination/limit-offset-pagination.dto';

export class GetBookingsQueryDto extends LimitOffsetPaginationDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
