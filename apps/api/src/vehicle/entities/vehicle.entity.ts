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
import { Location } from '../../locations/entities/location.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { MaintenanceRecord } from './maintenance-record.entity';

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum Transmission {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  DAMAGED = 'DAMAGED',
  RESERVED = 'RESERVED',
}

@Entity('vehicles')
@Index(['licensePlate'])
@Index(['vin'])
@Index(['status'])
@Index(['make', 'model'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ unique: true })
  licensePlate: string;

  @Column({ unique: true })
  vin: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'enum', enum: FuelType, default: FuelType.PETROL })
  fuelType: FuelType;

  @Column({ type: 'enum', enum: Transmission, default: Transmission.AUTO })
  transmission: Transmission;

  @Column({ type: 'int', default: 5 })
  seats: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'uuid' })
  locationId: string;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Location, (location) => location.vehicles)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];

  @OneToMany(() => MaintenanceRecord, (record) => record.vehicle)
  maintenanceRecords: MaintenanceRecord[];
}
