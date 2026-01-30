import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';

export enum PaymentMethod {
  CARD = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
@Index(['bookingId'])
@Index(['userId'])
@Index(['status'])
@Index(['transactionId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookingId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ unique: true, nullable: true })
  transactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Booking, (booking) => booking.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => User, (user) => user.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
