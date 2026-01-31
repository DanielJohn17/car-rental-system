import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile } from './entities/customer-profile.entity';
import { CustomerProfileRepository } from './repositories/customer-profile.repository';
import {
  CreateCustomerProfileDto,
  UpdateCustomerProfileDto,
  CustomerProfileResponseDto,
} from './dtos/customer-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepository: CustomerProfileRepository,
  ) {}

  async createCustomerProfile(
    createCustomerProfileDto: CreateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const existingProfile =
      await this.customerProfileRepository.findByUserId(
        createCustomerProfileDto.userId,
      );

    if (existingProfile) {
      throw new BadRequestException(
        'Customer profile already exists for this user',
      );
    }

    const profile = await this.customerProfileRepository.createCustomerProfile(
      createCustomerProfileDto,
    );

    return this.mapToResponseDto(profile);
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfileResponseDto> {
    const profile =
      await this.customerProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException(
        `Customer profile not found for user ${userId}`,
      );
    }

    return this.mapToResponseDto(profile);
  }

  async getCustomerProfileById(id: string): Promise<CustomerProfileResponseDto> {
    const profile = await this.customerProfileRepository.findByIdWithUser(id);

    if (!profile) {
      throw new NotFoundException(`Customer profile with id ${id} not found`);
    }

    return this.mapToResponseDto(profile);
  }

  async updateCustomerProfile(
    id: string,
    updateCustomerProfileDto: UpdateCustomerProfileDto,
  ): Promise<CustomerProfileResponseDto> {
    const profile = await this.customerProfileRepository.findByIdWithUser(id);

    if (!profile) {
      throw new NotFoundException(`Customer profile with id ${id} not found`);
    }

    const updated = await this.customerProfileRepository.updateCustomerProfile(
      id,
      updateCustomerProfileDto,
    );

    if (!updated) {
      throw new NotFoundException(`Customer profile with id ${id} not found`);
    }

    return this.mapToResponseDto(updated);
  }

  async deleteCustomerProfile(id: string): Promise<void> {
    const profile = await this.customerProfileRepository.findByIdWithUser(id);

    if (!profile) {
      throw new NotFoundException(`Customer profile with id ${id} not found`);
    }

    await this.customerProfileRepository.delete(id);
  }

  private mapToResponseDto(profile: CustomerProfile): CustomerProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      address: profile.address,
      idCardNumber: profile.idCardNumber,
      idCardType: profile.idCardType,
      depositStatus: profile.depositStatus,
      rating: profile.rating,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
