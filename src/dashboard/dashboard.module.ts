import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Supplier } from 'src/suppliers/entities/supplier.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { Cart } from 'src/carts/entities/cart.entity';
import { Category } from 'src/categories/entities/category.entity';
import { SubCategory } from 'src/sub-categories/entities/sub-category.entity';
import { Coupon } from 'src/coupons/entities/coupon.entity';
import { Product } from 'src/products/entities/product.entity';

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
