import {
  IsString,
  IsDateString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsEmail,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  guestName?: string;

  @IsString()
  guestPhone: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsUUID()
  vehicleId: string;

  @IsDateString()
  startDateTime: string;

  @IsDateString()
  endDateTime: string;

  @IsUUID()
  pickupLocationId: string;

  @IsUUID()
  returnLocationId: string;

  @IsNumber()
  @Min(0.01)
  totalPrice: number;

  @IsNumber()
  @Min(0.01)
  depositAmount: number;
}
