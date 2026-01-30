import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum IDCardType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
}

export enum DepositStatus {
  NONE = 'NONE',
  PAID = 'PAID',
  HELD = 'HELD',
}

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  idCardNumber: string;

  @Column({
    type: 'enum',
    enum: IDCardType,
    nullable: true,
  })
  idCardType: IDCardType;

  @Column({
    type: 'enum',
    enum: DepositStatus,
    default: DepositStatus.NONE,
  })
  depositStatus: DepositStatus;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.customerProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
