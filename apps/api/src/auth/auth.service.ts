import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { LoginDto, AdminRegisterDto, StaffRegisterDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerAdmin(adminRegisterDto: AdminRegisterDto) {
    const { email, password, fullName, phone, registrationToken } =
      adminRegisterDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Validate registration token if provided
    if (registrationToken) {
      const expectedToken = this.configService.get<string>(
        'ADMIN_REGISTRATION_TOKEN',
      );
      if (registrationToken !== expectedToken) {
        throw new UnauthorizedException('Invalid registration token');
      }
    }

    // Check if any admin already exists
    const adminExists = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (adminExists && !registrationToken) {
      throw new BadRequestException(
        'Admin already exists. Use registration token to create another admin.',
      );
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

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

  async registerStaff(adminId: string, staffRegisterDto: StaffRegisterDto) {
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
    const hashedPassword = await bcryptjs.hash(password, 10);

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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare password
    const isPasswordValid: boolean = (await bcryptjs.compare(
      password,
      user.passwordHash,
    )) as boolean;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Return token
    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: '7d',
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

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateToken(user);
  }

  async refreshAccessToken(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateToken(user);
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }
}
