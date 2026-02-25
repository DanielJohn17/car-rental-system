import { IsNumber, Min } from 'class-validator';

export class UpdateVehicleMileageDto {
  @IsNumber()
  @Min(0)
  mileage: number;
}
