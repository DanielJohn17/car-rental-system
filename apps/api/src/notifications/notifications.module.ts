import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  providers: [NotificationsService, EmailService],
  controllers: [NotificationsController],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
