import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from './mail/mail.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { BrandsModule } from './brands/brands.module';
import { CouponsModule } from './coupons/coupons.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CartsModule } from './carts/carts.module';
import { SettingsModule } from './settings/settings.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { OrdersModule } from './orders/orders.module';
import { StripeModule } from './stripe/stripe.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppController } from './app.controller';
import { dataSourceOptions } from 'db/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // LOCAL DATABASE CONFIGURATION
    // TypeOrmModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => {
    //     return {
    //       type: 'postgres',
    //       username: config.get<string>('DB_USERNAME'),
    //       password: config.get<string>('DB_PASSWORD'),
    //       database: config.get<string>('DB_DATABASE'),
    //       host: config.get<string>('DB_HOST'),
    //       port: config.get<number>('DB_PORT'),
    //       synchronize: process.env.NODE_ENV !== 'production',
    //       entities: ['dist/**/*.entity{.ts,.js}'],
    //       // entities: [Product, User, Review],
    //       logging: true, // enable logging
    //       logger: 'advanced-console', // more detailed logging
    //     };
    //   },
    // }),

    // REMOTE DATABASE CONFIGURATION
    TypeOrmModule.forRoot(dataSourceOptions),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_ACCESS,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN_ACCESS },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 10, // 10 requests per minute for a single IP
        },
      ],
    }),

    UsersModule,
    AuthModule,
    MailModule,
    CategoriesModule,
    SubCategoriesModule,
    BrandsModule,
    CouponsModule,
    SuppliersModule,
    ProductsModule,
    ReviewsModule,
    CartsModule,
    SettingsModule,
    CloudinaryModule,
    OrdersModule,
    StripeModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },

    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
