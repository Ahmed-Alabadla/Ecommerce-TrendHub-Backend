import { Exclude } from 'class-transformer';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import { GenderType, UserType } from 'src/utils/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: '100' })
  name: string;

  @Column({ type: 'varchar', length: '150', unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.CUSTOMER })
  role: UserType;

  @Column({ default: false })
  isAccountVerified: boolean;

  @Column({ nullable: true, type: 'varchar' })
  @Exclude()
  verificationToken: string | null;

  @Column({ nullable: true, type: 'varchar' })
  @Exclude()
  resetPasswordToken: string | null;

  @Column({ nullable: true, default: null })
  avatar: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'varchar', length: '20', nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: '255', nullable: true })
  // @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: GenderType, nullable: true })
  gender: string;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  // @OneToMany(() => Review, (review) => review.user)
  // reviews: Review[];
}
