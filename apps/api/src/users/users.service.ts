import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { User, UserRole } from '../auth/entities/user.entity';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffResponseDto,
  StaffListResponseDto,
} from './dtos/staff.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createStaffMember(
    createStaffDto: CreateStaffDto,
    adminId: string,
  ): Promise<StaffResponseDto> {
    const { email, password, fullName, phone, role } = createStaffDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create staff member
    const staffMember = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      phone,
      role,
      createdBy: adminId,
    });

    await this.userRepository.save(staffMember);

    return this.mapToResponseDto(staffMember);
  }

  async getStaffMembers(
    page: number = 1,
    limit: number = 10,
  ): Promise<StaffListResponseDto> {
    const [staff, total] = await this.userRepository.findAndCount({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SALES }],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: staff.map((s) => this.mapToResponseDto(s)),
      total,
      page,
      limit,
    };
  }

  async getStaffById(id: string): Promise<StaffResponseDto> {
    const staff = await this.userRepository.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return this.mapToResponseDto(staff);
  }

  async updateStaffMember(
    id: string,
    updateStaffDto: UpdateStaffDto,
    requestingUserId: string,
  ): Promise<StaffResponseDto> {
    const staff = await this.userRepository.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Allow users to update themselves, or admins to update anyone
    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    if (requestingUserId !== id && requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You can only update your own profile or be an admin',
      );
    }

    // Update fields
    if (updateStaffDto.fullName) {
      staff.fullName = updateStaffDto.fullName;
    }
    if (updateStaffDto.phone) {
      staff.phone = updateStaffDto.phone;
    }

    await this.userRepository.save(staff);

    return this.mapToResponseDto(staff);
  }

  async deleteStaffMember(
    id: string,
    adminId: string,
  ): Promise<{ message: string }> {
    const staff = await this.userRepository.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    // Only admin can delete staff
    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new NotFoundException('Admin user not found');
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete staff members');
    }

    // Don't allow deleting yourself
    if (id === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.userRepository.delete(id);

    return { message: 'Staff member deleted successfully' };
  }

  private mapToResponseDto(user: User): StaffResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy,
    };
  }
}
