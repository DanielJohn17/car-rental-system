import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'json', nullable: true })
  operatingHours: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Vehicle, (vehicle) => vehicle.location)
  vehicles: Vehicle[];

  @OneToMany(() => Booking, (booking) => booking.pickupLocation)
  pickupBookings: Booking[];

  @OneToMany(() => Booking, (booking) => booking.returnLocation)
  returnBookings: Booking[];
}
