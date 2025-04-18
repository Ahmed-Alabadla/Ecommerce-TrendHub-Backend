import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_DATABASE'),
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          synchronize: process.env.NODE_ENV !== 'production',
          entities: ['dist/**/*.entity{.ts,.js}'],
          // entities: [Product, User, Review],
        };
      },
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
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
  ],
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
