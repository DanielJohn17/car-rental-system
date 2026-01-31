import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsUUID, Min, Max } from 'class-validator';
import { FuelType, Transmission } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsString()
  licensePlate: string;

  @IsString()
  vin: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsEnum(Transmission)
  transmission: Transmission;

  @IsNumber()
  @Min(1)
  seats: number;

  @IsNumber()
  @Min(0.01)
  dailyRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  hourlyRate?: number;

  @IsUUID()
  locationId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
