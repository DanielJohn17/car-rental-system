import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UsersService } from './users.service';
import {
  CreateCustomerProfileDto,
  UpdateCustomerProfileDto,
  CustomerProfileResponseDto,
} from './dtos/customer-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('customer-profile')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a customer profile' })
  @ApiResponse({
    status: 201,
    description: 'Customer profile created successfully',
    type: CustomerProfileResponseDto,
  })
  async createCustomerProfile(
    @Body(ValidationPipe) createCustomerProfileDto: CreateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    return this.usersService.createCustomerProfile(createCustomerProfileDto);
  }

  @Get('customer-profile/:userId')
  @ApiOperation({ summary: 'Get customer profile by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile found',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async getCustomerProfile(
    @Param('userId') userId: string,
  ): Promise<CustomerProfileResponseDto> {
    return this.usersService.getCustomerProfile(userId);
  }

  @Get('customer-profile-by-id/:id')
  @ApiOperation({ summary: 'Get customer profile by profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile found',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async getCustomerProfileById(
    @Param('id') id: string,
  ): Promise<CustomerProfileResponseDto> {
    return this.usersService.getCustomerProfileById(id);
  }

  @Put('customer-profile/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({
    status: 200,
    description: 'Customer profile updated successfully',
    type: CustomerProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async updateCustomerProfile(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCustomerProfileDto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    return this.usersService.updateCustomerProfile(id, updateCustomerProfileDto);
  }

  @Delete('customer-profile/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete customer profile' })
  @ApiResponse({ status: 204, description: 'Customer profile deleted' })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async deleteCustomerProfile(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteCustomerProfile(id);
  }
}
