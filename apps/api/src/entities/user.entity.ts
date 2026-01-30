import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { CustomerProfile } from './customer-profile.entity';
import { Booking } from './booking.entity';
import { DamageReport } from './damage-report.entity';
import { Payment } from './payment.entity';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ nullable: true })
  drivingLicenseNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  licenseExpiry: Date;

  @Column({ default: false })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => CustomerProfile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  customerProfile: CustomerProfile;

  @OneToMany(() => Booking, (booking) => booking.user, { cascade: true })
  bookings: Booking[];

  @OneToMany(() => DamageReport, (report) => report.reporter, {
    cascade: true,
  })
  damageReports: DamageReport[];

  @OneToMany(() => Payment, (payment) => payment.user, { cascade: true })
  payments: Payment[];
}
