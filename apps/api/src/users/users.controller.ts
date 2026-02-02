import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffResponseDto,
  StaffListResponseDto,
} from './dtos/staff.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@ApiTags('Users (Admin & Sales Staff)')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/stripe/connect')
  @UseGuards(createRoleGuard([UserRole.ADMIN]))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Stripe Connect account for current admin',
    description:
      'Creates (if missing) a Stripe Express Connect account for the logged-in admin and returns an onboarding URL. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe Connect account created / onboarding link generated',
  })
  async connectStripeForMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ stripeConnectAccountId: string; onboardingUrl: string }> {
    return this.usersService.connectStripeAccountForAdmin(user.sub);
  }

  @Post()
  @UseGuards(createRoleGuard([UserRole.ADMIN]))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new sales staff member (Admin only)',
    description: 'Only admin users can create new sales team members',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Staff member created successfully',
    type: StaffResponseDto,
  })
  async createStaffMember(
    @Body(ValidationPipe) createStaffDto: CreateStaffDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffResponseDto> {
    return this.usersService.createStaffMember(createStaffDto, user.sub);
  }

  @Get()
  @UseGuards(createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({
    summary: 'List all staff members (paginated)',
    description: 'Admin and Sales can view staff members',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff members list',
    type: StaffListResponseDto,
  })
  async getStaffMembers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<StaffListResponseDto> {
    return this.usersService.getStaffMembers(page, limit);
  }

  @Get(':id')
  @UseGuards(createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({
    summary: 'Get staff member details',
    description: 'View a specific staff member profile',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member details',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Staff not found' })
  async getStaffById(@Param('id') id: string): Promise<StaffResponseDto> {
    return this.usersService.getStaffById(id);
  }

  @Put(':id')
  @UseGuards(createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({
    summary: 'Update staff member profile',
    description: 'Users can update their own profile, admins can update anyone',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member updated',
    type: StaffResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Staff not found' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update other users profile',
  })
  async updateStaffMember(
    @Param('id') id: string,
    @Body(ValidationPipe) updateStaffDto: UpdateStaffDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<StaffResponseDto> {
    return this.usersService.updateStaffMember(id, updateStaffDto, user.sub);
  }

  @Delete(':id')
  @UseGuards(createRoleGuard([UserRole.ADMIN]))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a staff member (Admin only)',
    description: 'Only admins can delete staff members',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Staff member deleted',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Staff not found' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only admins can delete staff',
  })
  async deleteStaffMember(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    return this.usersService.deleteStaffMember(id, user.sub);
  }
}
