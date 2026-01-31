import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { IDCardType, DepositStatus } from '../entities/customer-profile.entity';

export class CreateCustomerProfileDto {
  @ApiProperty({ description: 'User ID (UUID)' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ID card or passport number' })
  @IsOptional()
  @IsString()
  idCardNumber?: string;

  @ApiPropertyOptional({
    enum: IDCardType,
    description: 'Type of ID document',
  })
  @IsOptional()
  @IsEnum(IDCardType)
  idCardType?: IDCardType;
}

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ID card or passport number' })
  @IsOptional()
  @IsString()
  idCardNumber?: string;

  @ApiPropertyOptional({
    enum: IDCardType,
    description: 'Type of ID document',
  })
  @IsOptional()
  @IsEnum(IDCardType)
  idCardType?: IDCardType;

  @ApiPropertyOptional({
    enum: DepositStatus,
    description: 'Deposit status',
  })
  @IsOptional()
  @IsEnum(DepositStatus)
  depositStatus?: DepositStatus;

  @ApiPropertyOptional({ description: 'Customer rating' })
  @IsOptional()
  @IsNumber()
  rating?: number;
}

export class CustomerProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  address: string;

  @ApiPropertyOptional()
  idCardNumber: string;

  @ApiProperty({ enum: IDCardType })
  idCardType: IDCardType;

  @ApiProperty({ enum: DepositStatus })
  depositStatus: DepositStatus;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
