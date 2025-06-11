import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../orders/entities/order.entity';
import { Setting } from '../settings/entities/setting.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

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

  /**
   * Send order confirmation email to customer
   * @param order - The order details
   * @param settings - Store settings for email templates
   * @returns Promise that resolves when email is sent
   */
  async sendOrderConfirmation(order: Order, settings: Setting) {
    // Validate required parameters
    if (!order?.user?.email) {
      this.logger.error('Cannot send email: Missing user email');
      throw new InternalServerErrorException('Missing user email information');
    }
    try {
      await this.mailerService.sendMail({
        from: `TrendHub Shop ${this.config.get<string>('MAIL_USERNAME')}`,
        to: order.user.email,
        subject: 'Order Confirmation',
        template: 'order',
        context: {
          siteName: settings.store_name || 'Online Store',
          logoUrl: settings.store_logo || null,
          supportEmail:
            settings.store_email || this.config.get<string>('MAIL_USERNAME'),
          supportPhone: settings.store_phone || 'Contact Support',
          order: order,
        },
      });
      this.logger.log('Email sent successfully:', order.user.email);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw new RequestTimeoutException();
    }
  }
}
