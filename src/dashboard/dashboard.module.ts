import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Cart } from '../carts/entities/cart.entity';
import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../sub-categories/entities/sub-category.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      Brand,
      Cart,
      Category,
      SubCategory,
      Coupon,
      Order,
      Product,
      User,
      Supplier,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
