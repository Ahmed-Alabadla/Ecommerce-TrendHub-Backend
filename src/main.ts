import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // apply middleware
  app.use(helmet());

  // Use raw body parser for Stripe webhook route
  app.use(
    '/api/order/checkout/stripe/webhook',
    bodyParser.raw({ type: 'application/json' }),
  );

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.enableCors({
    origin: [process.env.APP_FRONTEND_URL, process.env.DASHBOARD_FRONTEND_URL],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // For Stripe webhooks, we need raw body
  //  app.use(
  //   '/orders/webhook',
  //   bodyParser.raw({ type: 'application/json' }),
  // );
  // // For the rest of the routes
  // app.use(bodyParser.json());
  // app.use(bodyParser.urlencoded({ extended: true }));

  app.setGlobalPrefix('api');

  await app.listen(8000);
}
bootstrap();
