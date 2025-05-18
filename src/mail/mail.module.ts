import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'node:path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [MailService],
  exports: [MailService],

  imports: [
    // MailerModule.forRoot({
    //   transport: {
    //     service: 'gmail',
    //     secure: false,
    //     auth: {
    //       user: process.env.MAIL_USERNAME,
    //       pass: process.env.MAIL_PASSWORD,
    //     },
    //   },
    //   template: {
    //     dir: join(__dirname, 'templates'),
    //     adapter: new EjsAdapter({
    //       inlineCssEnabled: true,
    //     }),
    //   },
    //   defaults: {
    //     from: `TrendHub Shop ${process.env.MAIL_USERNAME}`,
    //   },
    // }),

    // MailerModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => {
    //     return {
    //       transport: {
    //         service: 'gmail',
    //         secure: false,
    //         auth: {
    //           user: config.get<string>('MAIL_USERNAME'),
    //           pass: config.get<string>('MAIL_PASSWORD'),
    //         },
    //       },

    //       template: {
    //         dir: join(__dirname, 'templates'),
    //         adapter: new EjsAdapter({
    //           inlineCssEnabled: true,
    //         }),
    //       },
    //       defaults: {
    //         from: `TrendHub Shop ${config.get<string>('MAIL_USERNAME')}`,
    //       },
    //     };
    //   },
    // }),

    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587, // Use 587 with secure: false or 465 with secure: true
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.get<string>('MAIL_USERNAME'),
            pass: config.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"TrendHub Shop" <${config.get<string>('MAIL_USERNAME')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new EjsAdapter({
            inlineCssEnabled: true,
          }),
        },
      }),
    }),
  ],
})
export class MailModule {}
