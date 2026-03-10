import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  IsEnum,
} from 'class-validator';
import { VehicleStatus } from '../entities/vehicle.entity';
import { LimitOffsetPaginationDto } from '../../../core/pagination/limit-offset-pagination.dto';

export class SearchVehiclesDto extends LimitOffsetPaginationDto {
  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minDailyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDailyRate?: number;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSeats?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minMileage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMileage?: number;
}
