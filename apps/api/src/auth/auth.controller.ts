import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  AuthResponseDto,
  AdminRegisterDto,
  StaffRegisterDto,
} from './dtos';
import { JwtGuard } from './guards/jwt.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { createRoleGuard } from './guards/role.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register first admin account (initial setup)',
    description:
      'Register the first admin account without authentication. If admin already exists, provide registration token.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin registered successfully',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiBadRequestResponse({
    description: 'Admin already exists or invalid password',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid registration token' })
  async registerAdmin(
    @Body(ValidationPipe) adminRegisterDto: AdminRegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerAdmin(adminRegisterDto);
  }

  @Post('register/staff')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new sales staff member (Admin only)',
    description: 'Admin can register new sales staff members.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Staff member registered successfully',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiBadRequestResponse({ description: 'Invalid password' })
  @ApiUnauthorizedResponse({ description: 'Invalid token or not admin' })
  async registerStaff(
    @Body(ValidationPipe) staffRegisterDto: StaffRegisterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AuthResponseDto> {
    return this.authService.registerStaff(user.sub, staffRegisterDto);
  }

  @ApiOperation({
    summary: 'Login for admin and sales staff (email/password)',
    description:
      'Only admin and sales team members can login. Customers do not have accounts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Get current user profile (requires JWT)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @UseGuards(JwtGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: JwtPayload): Promise<AuthResponseDto> {
    return this.authService.getCurrentUser(user.sub);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New access token issued',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@CurrentUser() user: JwtPayload): Promise<AuthResponseDto> {
    return this.authService.refreshAccessToken(user.sub);
  }

  @ApiOperation({ summary: 'Logout user (requires JWT)' })
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing token' })
  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtPayload): Promise<{ message: string }> {
    return this.authService.logout(user.sub);
  }
}
