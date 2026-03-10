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
import { Vehicle } from './vehicle.entity';

export enum MaintenanceType {
  SERVICE = 'SERVICE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
}

@Entity('maintenance_records')
@Index(['vehicleId'])
@Index(['date'])
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vehicleId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @Column({ type: 'int' })
  mileageAtTime: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenanceRecords)
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;
}
