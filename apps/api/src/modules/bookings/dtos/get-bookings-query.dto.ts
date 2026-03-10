import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class GetBookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
