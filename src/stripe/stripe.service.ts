// src/stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Coupon } from 'src/coupons/entities/coupon.entity';
import { CouponType } from 'src/utils/enums';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') as string,
      {
        apiVersion: '2025-04-30.basil', // Use the latest API version
      },
    );
  }

  // Method to create a checkout session
  async createCheckoutSession(
    orderItems: Array<{
      name: string;
      description: string;
      imageCover: string;
      amount: number;
      quantity: number;
    }>,
    orderId: string,
    shippingPrice: number,
    tax_rate?: number,
    customerEmail?: string,
    coupon?: Coupon | null,
  ) {
    // Convert order items to Stripe line items
    const lineItems = orderItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description,
          images: [item.imageCover],
        },
        unit_amount: item.amount * 100, // Stripe requires amount in cents
      },
      quantity: item.quantity,
    }));

    // Create a checkout session configuration
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${this.configService.get('APP_FRONTEND_URL')}/orders`,
      cancel_url: `${this.configService.get('APP_FRONTEND_URL')}/cart`,
      metadata: {
        orderId,
      },

      ...(customerEmail && { customer_email: customerEmail }),
    };

    // Add coupon discount if provided
    if (coupon) {
      const couponStripe = await this.stripe.coupons.create({
        name: `Coupon: ${coupon.code}`,
        // For percentage type, use percent_off
        ...((coupon.type as CouponType) === CouponType.PERCENTAGE && {
          percent_off: Number(coupon.discount),
        }),
        // For fixed type, use amount_off (converted to cents)
        ...((coupon.type as CouponType) === CouponType.FIXED && {
          amount_off: Math.round(Number(coupon.discount) * 100),
          currency: 'usd',
        }),
        duration: 'once', // Coupon is only valid for this checkout
      });

      // Add the coupon to the session
      sessionOptions.discounts = [
        {
          coupon: couponStripe.id,
        },
      ];
    }

    // Add shipping options if shipping price is greater than 0
    if (shippingPrice > 0) {
      sessionOptions.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shippingPrice * 100), // Convert to cents
              currency: 'usd',
            },
            display_name: 'Shipping',
            // Add any additional shipping options here
          },
        },
      ];
    }

    // Add tax if applicable
    if (tax_rate && tax_rate > 0) {
      sessionOptions.tax_id_collection = {
        enabled: true,
      };
      const taxRate = await this.stripe.taxRates.create({
        display_name: 'Tax',
        percentage: tax_rate,
        inclusive: false,
      });

      sessionOptions.line_items = lineItems.map((item) => ({
        ...item,
        tax_rates: [taxRate.id],
      }));
    }

    // Create a checkout session
    const session = await this.stripe.checkout.sessions.create(sessionOptions);

    return session;
  }

  // Webhook handling for payment events
  constructEventFromPayload(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    ) as string;

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
