import { User } from 'src/users/entities/user.entity';
import { CURRENT_TIMESTAMP } from 'src/utils/constants';
import { OrderStatus, PaymentMethod } from 'src/utils/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  orderNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxPrice: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalOrderPrice: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CARD })
  paymentMethodType: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'date', nullable: true })
  paidAt: Date;

  @Column({ default: false })
  isDelivered: boolean;

  @Column({ type: 'date', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  stripeCheckoutId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  // ============= Relations =============

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',

    eager: true,
  })
  orderItems: OrderItem[];
}
