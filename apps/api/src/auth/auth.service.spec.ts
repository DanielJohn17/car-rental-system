import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { LoginDto, AdminRegisterDto, StaffRegisterDto } from './dtos';
import * as bcryptjs from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockUserRepository: any;

  const mockAdminUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    passwordHash: '$2a$10$hashedpassword',
    fullName: 'Admin User',
    phone: '+251912345678',
    role: UserRole.ADMIN,
    verified: true,
    refreshToken: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSalesUser = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    email: 'sales@example.com',
    passwordHash: '$2a$10$hashedpassword',
    fullName: 'Sales User',
    phone: '+251912345679',
    role: UserRole.SALES,
    verified: true,
    refreshToken: null,
    createdBy: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
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

  describe('registerAdmin', () => {
    const adminRegisterDto: AdminRegisterDto = {
      email: 'newadmin@example.com',
      password: 'SecurePassword123',
      fullName: 'New Admin',
      phone: '+251912345678',
    };

    it('should register admin', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // email check
      mockUserRepository.create.mockReturnValue({ ...adminRegisterDto });
      mockUserRepository.save.mockResolvedValue(mockAdminUser);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.registerAdmin(adminRegisterDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockAdminUser);

      await expect(service.registerAdmin(adminRegisterDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow creating another admin when an admin already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // email check
      mockUserRepository.create.mockReturnValue({ ...adminRegisterDto });
      mockUserRepository.save.mockResolvedValue(mockAdminUser);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.registerAdmin(adminRegisterDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
    });
  });

  describe('registerStaff', () => {
    const staffRegisterDto: StaffRegisterDto = {
      email: 'newstaff@example.com',
      password: 'SecurePassword123',
      fullName: 'New Staff',
      phone: '+251912345679',
    };

    it('should register new staff member', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockAdminUser); // admin check
      mockUserRepository.findOne.mockResolvedValueOnce(null); // email check
      mockUserRepository.create.mockReturnValue({ ...staffRegisterDto });
      mockUserRepository.save.mockResolvedValue(mockSalesUser);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.registerStaff(
        mockAdminUser.id,
        staffRegisterDto,
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
    });

    it('should throw UnauthorizedException if not admin', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockSalesUser); // not admin

      await expect(
        service.registerStaff(mockSalesUser.id, staffRegisterDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockAdminUser); // admin check
      mockUserRepository.findOne.mockResolvedValueOnce(mockSalesUser); // email check

      await expect(
        service.registerStaff(mockAdminUser.id, staffRegisterDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'admin@example.com',
      password: 'SecurePassword123',
    };

    it('should login user with correct credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockAdminUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('test-jwt-token');

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('test-jwt-token');
      expect(result.user.email).toBe(mockAdminUser.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockAdminUser);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
