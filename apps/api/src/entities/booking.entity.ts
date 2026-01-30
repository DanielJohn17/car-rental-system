import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { Location } from './location.entity';
import { Payment } from './payment.entity';
import { DamageReport } from './damage-report.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

@Entity('bookings')
@Index(['userId'])
@Index(['vehicleId'])
@Index(['status'])
@Index(['startDateTime', 'endDateTime'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({ type: 'timestamp' })
  startDateTime: Date;

  @Column({ type: 'timestamp' })
  endDateTime: Date;

  @Column({ type: 'uuid' })
  pickupLocationId: string;

  @Column({ type: 'uuid' })
  returnLocationId: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'timestamp', nullable: true })
  actualReturnDateTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.bookings)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @ManyToOne(() => Location, (location) => location.pickupBookings)
  @JoinColumn({ name: 'pickupLocationId' })
  pickupLocation: Location;

  @ManyToOne(() => Location, (location) => location.returnBookings)
  @JoinColumn({ name: 'returnLocationId' })
  returnLocation: Location;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @OneToMany(() => DamageReport, (report) => report.booking)
  damageReports: DamageReport[];
}
