import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sending verify email template
   * @param email  email of the registered user
   * @param name  name of the registered user
   * @param link  link with id of the user and verification token
   */
  async sendVerificationEmail(email: string, name: string, link: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: `TrendHub Shop ${this.config.get<string>('MAIL_USERNAME')}`,
        subject: 'Verify your account',
        template: 'verify-email',
        context: { link, name },
      });
    } catch {
      throw new RequestTimeoutException();
    }
  }

  /**
   * Sending reset password email template
   * @param email  email of the registered user
   * @param name  name of the registered user
   * @param link  link with id of the user and verification token
   */
  async sendResetPasswordEmail(email: string, name: string, link: string) {
    try {
      await this.mailerService.sendMail({
        from: `TrendHub Shop ${this.config.get<string>('MAIL_USERNAME')}`,
        to: email,
        subject: 'Reset your password',
        template: 'reset-password',
        context: { link, name },
      });
    } catch {
      throw new RequestTimeoutException();
    }
  }
}
