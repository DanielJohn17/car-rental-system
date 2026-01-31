import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomerProfile } from './entities/customer-profile.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CustomerProfile])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
