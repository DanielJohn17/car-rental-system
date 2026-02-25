import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import {
  LoginDto,
  AdminRegisterDto,
  StaffRegisterDto,
  AuthResponseDto,
} from './dtos';
import {
  ACCESS_TOKEN_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
  DEFAULT_JWT_REFRESH_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
} from './auth.constants';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register an admin account.
   */
  async registerAdmin(
    adminRegisterDto: AdminRegisterDto,
  ): Promise<AuthResponseDto> {
    const { email, password, fullName, phone } = adminRegisterDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, BCRYPT_SALT_ROUNDS);

    // Create admin user
    const admin = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      phone,
      role: UserRole.ADMIN,
      verified: true,
    });

    await this.userRepository.save(admin);

    return this.generateToken(admin);
  }

  /**
   * Register a sales staff member.
   */
  async registerStaff(
    adminId: string,
    staffRegisterDto: StaffRegisterDto,
  ): Promise<AuthResponseDto> {
    const { email, password, fullName, phone } = staffRegisterDto;

    // Verify requesting user is admin
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admins can register staff');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, BCRYPT_SALT_ROUNDS);

    // Create staff user
    const staff = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      phone,
      role: UserRole.SALES,
      verified: true,
      createdBy: adminId,
    });

    await this.userRepository.save(staff);

    return this.generateToken(staff);
  }

  /**
   * Login user by email/password.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare password
    const isPasswordValid: boolean = await bcryptjs.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return token
    return this.generateToken(user);
  }

  private generateToken(user: User): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken: string = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshTokenSecret: string =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      DEFAULT_JWT_REFRESH_SECRET;
    const refreshToken: string = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Validate and decode a JWT access token.
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getCurrentUser(userId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateToken(user);
  }

  async refreshAccessToken(userId: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateToken(user);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }
}
