import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsPhoneNumber,
  IsEnum,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../auth/entities/user.entity';

export class CreateStaffDto {
  @ApiProperty({
    example: 'sales@example.com',
    description: 'Email address for staff login',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of staff member',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '+251912345678',
    description: 'Phone number in E.164 format',
  })
  @IsPhoneNumber('ET')
  phone: string;

  @ApiProperty({
    enum: [UserRole.SALES],
    example: UserRole.SALES,
    description: 'Role (only SALES can be created by ADMIN)',
  })
  @IsEnum([UserRole.SALES])
  role: UserRole.SALES;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+251912345678',
    description: 'Phone number',
  })
  @IsOptional()
  @IsPhoneNumber('ET')
  phone?: string;
}

export class StaffResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.SALES] })
  role: UserRole;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  createdBy?: string;
}

export class StaffListResponseDto {
  @ApiProperty({ type: [StaffResponseDto] })
  data: StaffResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
