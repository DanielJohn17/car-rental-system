import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dtos';
import * as bcryptjs from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockUserRepository: any;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    fullName: 'Test User',
    phone: '+251912345678',
    role: UserRole.CUSTOMER,
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123',
      fullName: 'New User',
      phone: '+251912345679',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue({ ...registerDto });
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already in use',
      );
    });

    it('should hash password before saving', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue({ ...registerDto });
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      await service.register(registerDto);

      expect(bcryptjs.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should create user with hashed password', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue({ ...registerDto });
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      await service.register(registerDto);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          passwordHash: 'hashedPassword',
          fullName: registerDto.fullName,
          phone: registerDto.phone,
        }),
      );
    });

    it('should return JWT token on successful registration', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue({ ...registerDto });
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.register(registerDto);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePassword123',
    };

    it('should login user with correct credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should compare password with hash', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      await service.login(loginDto);

      expect(bcryptjs.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should return user data on successful login', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.login(loginDto);

      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.fullName).toBe(mockUser.fullName);
      expect(result.user.role).toBe(mockUser.role);
    });
  });

  describe('validateToken', () => {
    const token = 'valid-jwt-token';

    it('should validate a valid token', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      (jwtService.verify as jest.Mock).mockReturnValue(payload);

      const result = await service.validateToken(token);

      expect(result).toEqual(payload);
      expect(jwtService.verify).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with correct message', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.getCurrentUser(mockUser.id);

      expect(result).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentUser('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getCurrentUser('invalid-id')).rejects.toThrow(
        'User not found',
      );
    });

    it('should return accessToken along with user data', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.getCurrentUser(mockUser.id);

      expect(result.accessToken).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
    });
  });

  describe('token generation', () => {
    it('should generate token with correct payload structure', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        fullName: 'New User',
        phone: '+251912345679',
      };

      const savedUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...registerDto,
        passwordHash: 'hashedPassword',
        role: UserRole.CUSTOMER,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: expect.any(String),
          email: expect.any(String),
          role: expect.any(String),
        }),
        expect.objectContaining({
          expiresIn: '24h',
        }),
      );
    });

    it('should include user id in token payload', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePassword123',
      };

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
        }),
        expect.any(Object),
      );
    });
  });
});
