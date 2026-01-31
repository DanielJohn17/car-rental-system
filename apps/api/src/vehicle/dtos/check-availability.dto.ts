import { IsDateString, IsUUID } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsUUID()
  locationId: string;
}
