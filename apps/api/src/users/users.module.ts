import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomerProfile } from './entities/customer-profile.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CustomerProfileRepository } from './repositories/customer-profile.repository';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CustomerProfile])],
  providers: [UsersService, CustomerProfileRepository],
  controllers: [UsersController],
  exports: [UsersService, CustomerProfileRepository],
})
export class UsersModule {}
