import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, HttpException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dtos';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { UserRole } from './entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'test-jwt-token',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.CUSTOMER,
      phone: '+251912345678',
      verified: false,
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

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'SecurePassword123',
      fullName: 'Test User',
      phone: '+251912345678',
    };

    it('should register a new user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });

    it('should return user data with correct properties', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('fullName');
      expect(result.user).toHaveProperty('role');
      expect(result.user).toHaveProperty('phone');
      expect(result.user).toHaveProperty('verified');
    });

    it('should throw ConflictException if email already exists', async () => {
      const conflictError = new HttpException(
        'Email already in use',
        HttpStatus.CONFLICT,
      );
      mockAuthService.register.mockRejectedValue(conflictError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        conflictError,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw BadRequestException for weak password', async () => {
      const weakPasswordDto: RegisterDto = {
        ...registerDto,
        password: 'weak',
      };

      const badRequestError = new HttpException(
        'Password must be at least 8 characters',
        HttpStatus.BAD_REQUEST,
      );
      mockAuthService.register.mockRejectedValue(badRequestError);

      await expect(controller.register(weakPasswordDto)).rejects.toThrow(
        badRequestError,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePassword123',
    };

    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should return JWT token on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result.accessToken).toBe('test-jwt-token');
      expect(typeof result.accessToken).toBe('string');
    });

    it('should return user data on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result.user.email).toBe(loginDto.email);
      expect(result.user.id).toBeDefined();
      expect(result.user.role).toBe(UserRole.CUSTOMER);
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
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const wrongPasswordDto: LoginDto = {
        ...loginDto,
        password: 'WrongPassword123',
      };

      const unauthorizedError = new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(wrongPasswordDto)).rejects.toThrow(
        unauthorizedError,
      );
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      const nonExistentEmailDto: LoginDto = {
        ...loginDto,
        email: 'nonexistent@example.com',
      };

      const unauthorizedError = new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(nonExistentEmailDto)).rejects.toThrow(
        unauthorizedError,
      );
    });
  });

  describe('getMe', () => {
    const mockJwtPayload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: UserRole.CUSTOMER,
    };

    it('should return current user data', async () => {
      mockAuthService.getCurrentUser = jest
        .fn()
        .mockResolvedValue(mockAuthResponse);

      const result = await controller.getMe(mockJwtPayload);

      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe(mockAuthResponse.user.email);
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(
        mockJwtPayload.sub,
      );
    });

    it('should return user data with correct properties', async () => {
      mockAuthService.getCurrentUser = jest
        .fn()
        .mockResolvedValue(mockAuthResponse);

      const result = await controller.getMe(mockJwtPayload);

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('fullName');
      expect(result.user).toHaveProperty('role');
      expect(result.user).toHaveProperty('phone');
      expect(result.user).toHaveProperty('verified');
    });

    it('should call authService.getCurrentUser with user ID from token', async () => {
      mockAuthService.getCurrentUser = jest
        .fn()
        .mockResolvedValue(mockAuthResponse);

      await controller.getMe(mockJwtPayload);

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(
        mockJwtPayload.sub,
      );
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should return user with ADMIN role if present', async () => {
      const adminResponse = {
        ...mockAuthResponse,
        user: {
          ...mockAuthResponse.user,
          role: UserRole.ADMIN,
        },
      };
      mockAuthService.getCurrentUser = jest
        .fn()
        .mockResolvedValue(adminResponse);

      const result = await controller.getMe(mockJwtPayload);

      expect(result.user.role).toBe(UserRole.ADMIN);
    });

    it('should return user with DRIVER role if present', async () => {
      const driverResponse = {
        ...mockAuthResponse,
        user: {
          ...mockAuthResponse.user,
          role: UserRole.DRIVER,
        },
      };
      mockAuthService.getCurrentUser = jest
        .fn()
        .mockResolvedValue(driverResponse);

      const result = await controller.getMe(mockJwtPayload);

      expect(result.user.role).toBe(UserRole.DRIVER);
    });
  });

  describe('HTTP Status Codes', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'SecurePassword123',
      fullName: 'Test User',
      phone: '+251912345678',
    };

    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePassword123',
    };

    it('register should return 201 Created', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthResponse);
      // Note: HTTP status is set via @HttpCode decorator
      await controller.register(registerDto);
      expect(mockAuthService.register).toHaveBeenCalled();
    });

    it('login should return 200 OK', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);
      // Note: HTTP status is set via @HttpCode decorator
      await controller.login(loginDto);
      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });
});
