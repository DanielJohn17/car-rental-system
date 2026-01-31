import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, AdminRegisterDto, StaffRegisterDto } from './dtos';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { UserRole } from './entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    registerAdmin: jest.fn(),
    registerStaff: jest.fn(),
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshAccessToken: jest.fn(),
    logout: jest.fn(),
  };

  const mockAdminResponse: AuthResponseDto = {
    accessToken: 'test-jwt-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      phone: '+251912345678',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockSalesResponse: AuthResponseDto = {
    accessToken: 'test-jwt-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: '223e4567-e89b-12d3-a456-426614174000',
      email: 'sales@example.com',
      fullName: 'Sales User',
      role: UserRole.SALES,
      phone: '+251912345679',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerAdmin', () => {
    const adminRegisterDto: AdminRegisterDto = {
      email: 'admin@example.com',
      password: 'SecurePassword123',
      fullName: 'Admin User',
      phone: '+251912345678',
    };

    it('should register admin successfully', async () => {
      mockAuthService.registerAdmin.mockResolvedValue(mockAdminResponse);

      const result = await controller.registerAdmin(adminRegisterDto);

      expect(result).toEqual(mockAdminResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(adminRegisterDto.email);
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(mockAuthService.registerAdmin).toHaveBeenCalledWith(
        adminRegisterDto,
      );
    });

    it('should return admin data with correct properties', async () => {
      mockAuthService.registerAdmin.mockResolvedValue(mockAdminResponse);

      const result = await controller.registerAdmin(adminRegisterDto);

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('fullName');
      expect(result.user).toHaveProperty('role');
      expect(result.user.role).toBe(UserRole.ADMIN);
    });

    it('should throw ConflictException if email already exists', async () => {
      const conflictError = new HttpException(
        'Email already in use',
        HttpStatus.CONFLICT,
      );
      mockAuthService.registerAdmin.mockRejectedValue(conflictError);

      await expect(controller.registerAdmin(adminRegisterDto)).rejects.toThrow(
        conflictError,
      );
    });

    it('should throw BadRequestException if admin exists without token', async () => {
      const badRequestError = new HttpException(
        'Admin already exists. Use registration token to create another admin.',
        HttpStatus.BAD_REQUEST,
      );
      mockAuthService.registerAdmin.mockRejectedValue(badRequestError);

      await expect(controller.registerAdmin(adminRegisterDto)).rejects.toThrow(
        badRequestError,
      );
    });
  });

  describe('registerStaff', () => {
    const staffRegisterDto: StaffRegisterDto = {
      email: 'sales@example.com',
      password: 'SecurePassword123',
      fullName: 'Sales User',
      phone: '+251912345679',
    };

    const mockJwtPayload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    it('should register staff successfully', async () => {
      mockAuthService.registerStaff.mockResolvedValue(mockSalesResponse);

      const result = await controller.registerStaff(
        staffRegisterDto,
        mockJwtPayload,
      );

      expect(result).toEqual(mockSalesResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(staffRegisterDto.email);
      expect(result.user.role).toBe(UserRole.SALES);
      expect(mockAuthService.registerStaff).toHaveBeenCalledWith(
        mockJwtPayload.sub,
        staffRegisterDto,
      );
    });

    it('should return staff data with correct properties', async () => {
      mockAuthService.registerStaff.mockResolvedValue(mockSalesResponse);

      const result = await controller.registerStaff(
        staffRegisterDto,
        mockJwtPayload,
      );

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('fullName');
      expect(result.user).toHaveProperty('role');
      expect(result.user.role).toBe(UserRole.SALES);
    });

    it('should throw ConflictException if email already exists', async () => {
      const conflictError = new HttpException(
        'Email already in use',
        HttpStatus.CONFLICT,
      );
      mockAuthService.registerStaff.mockRejectedValue(conflictError);

      await expect(
        controller.registerStaff(staffRegisterDto, mockJwtPayload),
      ).rejects.toThrow(conflictError);
    });

    it('should throw UnauthorizedException if not admin', async () => {
      const unauthorizedError = new HttpException(
        'Only admins can register staff',
        HttpStatus.UNAUTHORIZED,
      );
      mockAuthService.registerStaff.mockRejectedValue(unauthorizedError);

      const nonAdminPayload = {
        ...mockJwtPayload,
        role: UserRole.SALES,
      };

      await expect(
        controller.registerStaff(staffRegisterDto, nonAdminPayload),
      ).rejects.toThrow(unauthorizedError);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'admin@example.com',
      password: 'SecurePassword123',
    };

    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAdminResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAdminResponse);
      expect(result.accessToken).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return JWT token on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAdminResponse);

      const result = await controller.login(loginDto);

      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.refreshToken).toBe('test-refresh-token');
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const unauthorizedError = new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow(
        unauthorizedError,
      );
    });
  });

  describe('getMe', () => {
    const mockJwtPayload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    it('should return current user data', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockAdminResponse);

      const result = await controller.getMe(mockJwtPayload);

      expect(result).toEqual(mockAdminResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(mockAdminResponse.user.email);
    });

    it('should call authService.getCurrentUser with user ID', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockAdminResponse);

      await controller.getMe(mockJwtPayload);

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(
        mockJwtPayload.sub,
      );
    });
  });

  describe('refresh', () => {
    const mockJwtPayload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    it('should refresh access token successfully', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue(mockAdminResponse);

      const result = await controller.refresh(mockJwtPayload);

      expect(result).toEqual(mockAdminResponse);
      expect(result.accessToken).toBeDefined();
      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(
        mockJwtPayload.sub,
      );
    });
  });

  describe('logout', () => {
    const mockJwtPayload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    it('should logout successfully', async () => {
      const logoutResponse = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(logoutResponse);

      const result = await controller.logout(mockJwtPayload);

      expect(result).toEqual(logoutResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockJwtPayload.sub);
    });
  });

  describe('HTTP Status Codes', () => {
    const adminRegisterDto: AdminRegisterDto = {
      email: 'admin@example.com',
      password: 'SecurePassword123',
      fullName: 'Admin User',
      phone: '+251912345678',
    };

    const loginDto: LoginDto = {
      email: 'admin@example.com',
      password: 'SecurePassword123',
    };

    it('registerAdmin should return 201 Created', async () => {
      mockAuthService.registerAdmin.mockResolvedValue(mockAdminResponse);
      await controller.registerAdmin(adminRegisterDto);
      expect(mockAuthService.registerAdmin).toHaveBeenCalled();
    });

    it('login should return 200 OK', async () => {
      mockAuthService.login.mockResolvedValue(mockAdminResponse);
      await controller.login(loginDto);
      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });
});
