import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
