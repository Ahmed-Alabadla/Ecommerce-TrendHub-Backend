import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from 'src/products/entities/product.entity';
import { UsersModule } from 'src/users/users.module';
import { Coupon } from 'src/coupons/entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product, Coupon]),
    UsersModule,
  ],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
