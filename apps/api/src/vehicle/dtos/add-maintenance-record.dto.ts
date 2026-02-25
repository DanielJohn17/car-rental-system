import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MaintenanceType } from '../entities/maintenance-record.entity';

export class AddMaintenanceRecordDto {
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsNumber()
  @Min(0)
  mileageAtTime: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
