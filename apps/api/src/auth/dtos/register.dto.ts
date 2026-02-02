import { IsEmail, IsString, MinLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminRegisterDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email for login',
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
    example: 'John Admin',
    description: 'Full name of admin',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '+251912345678',
    description: 'Phone number in E.164 format',
  })
  @IsPhoneNumber('ET')
  phone: string;
}

export class StaffRegisterDto {
  @ApiProperty({
    example: 'sales@example.com',
    description: 'Sales staff email for login',
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
    example: 'Jane Sales',
    description: 'Full name of staff member',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '+251912345679',
    description: 'Phone number in E.164 format',
  })
  @IsPhoneNumber('ET')
  phone: string;
}
