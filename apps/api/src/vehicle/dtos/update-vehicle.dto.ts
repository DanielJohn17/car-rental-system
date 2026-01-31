import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsUUID, Min, Max } from 'class-validator';
import { FuelType, Transmission, VehicleStatus } from '../entities/vehicle.entity';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  dailyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  hourlyRate?: number;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
