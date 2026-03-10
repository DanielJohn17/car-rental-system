import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';

@Injectable()
export class CustomerProfileRepository extends Repository<CustomerProfile> {
  constructor(private dataSource: DataSource) {
    super(CustomerProfile, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    return this.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async createCustomerProfile(
    data: Partial<CustomerProfile>,
  ): Promise<CustomerProfile> {
    const profile = this.create(data);
    return this.save(profile);
  }

  async updateCustomerProfile(
    id: string,
    data: Partial<CustomerProfile>,
  ): Promise<CustomerProfile | null> {
    const { user, ...updateData } = data;
    await this.update(id, updateData);
    return this.findOne({ where: { id }, relations: ['user'] });
  }

  async findByIdWithUser(id: string): Promise<CustomerProfile | null> {
    return this.findOne({
      where: { id },
      relations: ['user'],
    });
  }
}
