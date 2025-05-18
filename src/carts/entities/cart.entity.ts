import { Coupon } from 'src/coupons/entities/coupon.entity';
import { User } from 'src/users/entities/user.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
  })
  totalPriceAfterDiscount: number;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  // ============= Relations =============

  @ManyToOne(() => Coupon)
  coupon: Coupon | null;

  @OneToOne(() => User, (user) => user.cart)
  @JoinColumn() // This must be on one side only, typically the "owning" side
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',

    eager: true,
  })
  cartItems: CartItem[];
}
