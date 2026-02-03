import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { User } from '../auth/entities/user.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './services/stripe.service';
import { StripeConnectDemoController } from './stripe-connect-demo.controller';
import { StripeConnectDemoService } from './stripe-connect-demo.service';

@Module({
  imports: [
    AuthModule,
    BookingsModule,
    TypeOrmModule.forFeature([Payment, Booking, Vehicle, User]),
  ],
  providers: [PaymentsService, StripeService, StripeConnectDemoService],
  controllers: [PaymentsController, StripeConnectDemoController],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}
