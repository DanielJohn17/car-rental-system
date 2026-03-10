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
    const existingUser = await this.userRepository.findOne({
      where: { email: createStaffDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const password = await bcryptjs.hash(createStaffDto.password, 10);

    const user = this.userRepository.create({
      email: createStaffDto.email,
      passwordHash: password,
      fullName: createStaffDto.fullName,
      phone: createStaffDto.phone,
      role: createStaffDto.role,
      createdBy: adminId,
    });

    await this.userRepository.save(user);

    return this.mapToResponseDto(user);
  }

  async getStaffMembers(
    page: number = 1,
    limit: number = 10,
  ): Promise<StaffListResponseDto> {
    const [staff, total] = await this.userRepository.findAndCount({
      where: [{ role: UserRole.SALES }, { role: UserRole.ADMIN }],
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

    const requestingUser = await this.userRepository.findOne({
      where: { id: requestingUserId },
    });

    // Only admin can update other admins; staff can only update themselves
    if (staff.role === UserRole.ADMIN && id !== requestingUserId) {
      if (!requestingUser || requestingUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can update other admins');
      }
    }

    if (updateStaffDto.fullName) {
      staff.fullName = updateStaffDto.fullName;
    }
    if (updateStaffDto.phone) {
      staff.phone = updateStaffDto.phone;
    }
    if (updateStaffDto.role) {
      staff.role = updateStaffDto.role;
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

    const admin = await this.userRepository.findOne({ where: { id: adminId } });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete staff members');
    }

    if (id === adminId) {
      throw new BadRequestException('You cannot delete your own account');
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
    };
  }
}
