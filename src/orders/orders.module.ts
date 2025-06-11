import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { Setting } from '../settings/entities/setting.entity';
import { Product } from '../products/entities/product.entity';
import { CartItem } from '../carts/entities/cart-item.entity';
import { StripeModule } from '../stripe/stripe.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    StripeModule,
    MailModule,
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Cart,
      Setting,
      Product,
      CartItem,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
