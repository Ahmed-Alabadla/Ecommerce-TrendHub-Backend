import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from 'src/carts/entities/cart.entity';
import { Setting } from 'src/settings/entities/setting.entity';
import { Product } from 'src/products/entities/product.entity';
import { CartItem } from 'src/carts/entities/cart-item.entity';
import { StripeModule } from 'src/stripe/stripe.module';
import { MailModule } from 'src/mail/mail.module';

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
