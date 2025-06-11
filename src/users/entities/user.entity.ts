import { Exclude } from 'class-transformer';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';
import { Cart } from '../../carts/entities/cart.entity';
import { Order } from '../../orders/entities/order.entity';
import { Review } from '../../reviews/entities/review.entity';
import { CURRENT_TIMESTAMP } from '../../utils/constants';
import { GenderType, UserType } from '../../utils/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
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

  @Column({ nullable: true, default: null })
  avatar: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'varchar', length: '20', nullable: true })
  phone: string;

  // @Column({ type: 'varchar', length: '255', nullable: true })
  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: GenderType, nullable: true })
  gender: string;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  // ============ Relations ============

  @OneToMany(() => PasswordResetToken, (token) => token.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  passwordResetTokens: PasswordResetToken[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
