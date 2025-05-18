import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, OrderStatusCash, PaymentMethod } from 'src/utils/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from 'src/carts/entities/cart.entity';
import { Setting } from 'src/settings/entities/setting.entity';
import { Product } from 'src/products/entities/product.entity';
import { CartItem } from 'src/carts/entities/cart-item.entity';
import { StripeService } from 'src/stripe/stripe.service';
import Stripe from 'stripe';
import { MailService } from 'src/mail/mail.service';
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Cart)
    private readonly cartsRepository: Repository<Cart>,

    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,

    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    @InjectRepository(CartItem)
    private readonly cartItemsRepository: Repository<CartItem>,

    private readonly stripeService: StripeService,

    private readonly mailService: MailService,
  ) {}

  /**
   * Create a new order
   * @param paymentMethod - The payment method used for the order
   * @param userId - The ID of the user placing the order
   * @param createOrderDto - The DTO containing order details
   * @returns The created order or a redirect URL for Stripe checkout
   */
  async create(
    paymentMethod: PaymentMethod,
    userId: number,
    createOrderDto: CreateOrderDto,
  ) {
    // Find Cart By user
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'cartItems.product', 'user', 'coupon'],
    });
    if (!cart) {
      throw new NotFoundException("Don't have any cart yet!");
    }

    if (!createOrderDto?.shippingAddress && !cart.user?.address) {
      throw new BadRequestException(
        'Please provide a shipping address or update your profile address',
      );
    }

    // Find settings
    const FindSettings = await this.settingsRepository.find();
    const settings = FindSettings[0];

    const totalCartPrice =
      cart.totalPriceAfterDiscount && cart.totalPriceAfterDiscount > 0
        ? cart.totalPriceAfterDiscount
        : cart.totalPrice;

    // Check if tax is enabled and calculate tax price
    let taxPrice: number = 0;
    if (settings.tax_enabled) {
      taxPrice = totalCartPrice
        ? (Number(totalCartPrice) * Number(settings.tax_rate)) / 100
        : 0;
    }

    // Check if shipping is enabled and calculate shipping price
    let shippingPrice: number = 0;
    if (settings.shipping_enabled) {
      shippingPrice = totalCartPrice
        ? (Number(totalCartPrice) * Number(settings.shipping_rate)) / 100
        : 0;
    }

    // Calculate the total order price
    const totalOrderPrice = Number(totalCartPrice) + taxPrice + shippingPrice;

    const newOrder = this.ordersRepository.create({
      taxPrice,
      shippingPrice,
      paymentMethodType: paymentMethod,
      totalOrderPrice,
      orderItems: [],
      user: cart.user,
      shippingAddress: createOrderDto?.shippingAddress
        ? createOrderDto.shippingAddress
        : cart.user?.address,
    });

    // set the cart items to the order
    if (cart.cartItems && cart.cartItems.length > 0) {
      await Promise.all(
        cart.cartItems.map(async (item) => {
          const orderItem = this.orderItemsRepository.create({
            product: item.product,
            quantity: item.quantity,
            order: newOrder,
          });
          await this.orderItemsRepository.save(orderItem);

          newOrder.orderItems.push(orderItem);
        }),
      );
    }

    await this.ordersRepository.save(newOrder);
    // Generate a unique order number
    newOrder.orderNumber = this.generateOrderNumberCandidate(newOrder.id);

    // Check if the payment method is cash
    // If it is, set the order as delivered and update the product quantities
    if (paymentMethod === PaymentMethod.CASH) {
      newOrder.isDelivered = true;
      newOrder.deliveredAt = new Date();
      await this.cleanupUserCart(newOrder.user.id);

      await this.sendOrderConfirmationEmail(newOrder);
      return await this.ordersRepository.save(newOrder);
    }

    // If the payment method is card, create a checkout session
    if (paymentMethod === PaymentMethod.CARD) {
      // Create a checkout session with Stripe

      const orderItems = newOrder.orderItems.map((item) => ({
        name: item.product.name,
        description: item.product.description,
        imageCover: item.product.imageCover,
        amount:
          Number(item.product.priceAfterDiscount) > 0
            ? Number(item.product.priceAfterDiscount)
            : Number(item.product.price),
        quantity: item.quantity,
      }));

      const session = await this.stripeService.createCheckoutSession(
        orderItems,
        newOrder.id.toString(),
        shippingPrice,
        settings.tax_enabled ? settings.tax_rate : 0,
        cart.user?.email,
        cart.coupon,
      );

      newOrder.stripeCheckoutId = session.id;
      // Update order with Stripe checkout ID
      await this.ordersRepository.save(newOrder);

      // Return the session URL to redirect the user
      return {
        session_url: session.url,
        order: newOrder,
      };
    }
  }

  /**
   * Update the order status to paid and update product quantities
   * @param orderId - The ID of the order to update
   * @returns The updated order
   */
  async updatePaidStatusCash(orderId: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.product', 'user'],
    });

    if (!order)
      throw new NotFoundException(`Order with Id ${orderId} not found!`);

    if (order.isPaid) throw new BadRequestException('Order already paid!');

    if ((order.paymentMethodType as PaymentMethod) !== PaymentMethod.CASH)
      throw new BadRequestException(
        'Payment method is not valid for this operation!',
      );

    if (order.status === OrderStatus.CANCELLED)
      throw new BadRequestException('Order already cancelled!');
    if (updateOrderDto.status === OrderStatusCash.CANCELLED) {
      order.status = OrderStatus.CANCELLED;
      order.isPaid = false;
      order.isDelivered = false;
      return await this.ordersRepository.save(order);
    }
    await this.updateProductInventory(order);

    // Update the order status to paid
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = OrderStatus.PAID;
    order.isDelivered = false;

    return await this.ordersRepository.save(order);
  }

  /**
   * Handle Stripe webhook events
   * @param payload - The raw payload from Stripe
   * @param signature - The Stripe signature header
   */
  async handleStripeWebhook(payload: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = this.stripeService.constructEventFromPayload(signature, payload);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);

      throw new BadRequestException(`Webhook Error: ${err}`);
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'checkout.session.async_payment_failed':
        case 'checkout.session.expired':
          await this.handleCheckoutSessionFailed(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true, status: 'success' };
    } catch (error) {
      this.logger.error(`Error processing webhook ${event.type}: ${error}`);
      throw error; // Let NestJS handle the error response
    }
  }

  /**
   * Get all orders for a specific user
   * @param userId - The ID of the user
   * @returns An array of orders for the user
   */
  async getAllOrdersByUser(userId: number) {
    const orders = await this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: ['orderItems', 'orderItems.product', 'user'],
      order: { createdAt: 'DESC' },
    });

    return orders;
  }

  /**
   * Get a specific order by ID for a user
   * @param orderId - The ID of the order
   * @param userId - The ID of the user
   * @returns The order with the specified ID for the user
   */
  async getOrderById(orderId: number, userId: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['orderItems', 'orderItems.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with Id ${orderId} not found!`);
    }

    return order;
  }

  /**
   * Generate a unique order number candidate
   * @param orderId - The ID of the order
   * @returns A unique order number candidate
   */
  private generateOrderNumberCandidate(orderId: number): string {
    const prefix = 'ORD';
    const data = new Date();
    const year = data.getFullYear().toString();
    const month = (data.getMonth() + 1).toString().padStart(2, '0');
    const day = data.getDate().toString().padStart(2, '0');
    const paddedOrderId = orderId.toString().padStart(8, '0');
    return `${prefix}-${year}${month}${day}-${paddedOrderId}`;
  }

  /**
   * Handle the checkout session completed event
   * @param session - The Stripe checkout session object
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const sessionId = session.id;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      throw new BadRequestException('Order ID is missing in session metadata');
    }

    // Find order by session ID and order ID with validation
    const order = await this.ordersRepository.findOne({
      where: { stripeCheckoutId: sessionId, id: Number(orderId) },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      this.logger.error(
        `Order not found for session ID: ${sessionId}, order ID: ${orderId}`,
      );

      throw new BadRequestException(
        `Order not found for session ID: ${sessionId}`,
      );
    }

    // Update order status atomically
    order.isPaid = true;
    order.paidAt = new Date();
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.status = OrderStatus.PAID;

    await this.ordersRepository.save(order);

    // Process successful order completion in parallel tasks

    await Promise.all([
      this.sendOrderConfirmationEmail(order),
      this.updateProductInventory(order),
      this.cleanupUserCart(order.user.id),
      this.logger.log(`Order ${order.id} processed successfully`),
    ]);
  }

  /**
   * Handle the checkout session failed event
   * @param session - The Stripe checkout session object
   */
  private async handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
    const sessionId = session.id;
    const orderId = session.metadata?.orderId;
    if (!orderId)
      throw new BadRequestException('Order ID is missing in session metadata');

    // Find order by session ID and order ID with validation
    const order = await this.ordersRepository.findOne({
      where: { stripeCheckoutId: sessionId, id: Number(orderId) },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });
    if (!order) {
      this.logger.error(
        `Order not found for session ID: ${sessionId}, order ID: ${orderId}`,
      );
      throw new BadRequestException(
        `Order not found for session ID: ${sessionId}`,
      );
    }

    // Only update if still in pending state to avoid race conditions
    if (order.status !== OrderStatus.PENDING) {
      this.logger.log(
        `Order ${order.id} already in ${order.status} state, skipping update`,
      );

      return;
    }

    // Determine the appropriate status
    order.status =
      session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)
        ? OrderStatus.CANCELLED
        : OrderStatus.FAILED;

    await this.ordersRepository.save(order);
    this.logger.log(`Order ${order.id} status updated to ${order.status}`);
  }

  /**
   * Update product quantities and sold count based on the order
   * @param order - The order to process
   */
  private async updateProductInventory(order: Order) {
    if (!order.orderItems || order.orderItems.length === 0) {
      this.logger.warn(`Order ${order.id} has no items to update`);
      return;
    }
    for (const item of order.orderItems) {
      try {
        const product = await this.productsRepository.findOne({
          where: { id: item.product.id },
        });

        if (product) {
          product.quantity -= item.quantity;
          product.sold += item.quantity;
          await this.productsRepository.save(product);
        }
      } catch (error) {
        this.logger.error(
          `Failed to update product ${item.product.id}: ${error}`,
        );
        // Continue with other products even if one fails
      }
    }
  }

  /**
   * Cleanup the user's cart after order completion
   * @param userId - The ID of the user
   */
  private async cleanupUserCart(userId: number) {
    const cart = await this.cartsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'user'],
    });

    if (!cart) {
      throw new NotFoundException("Don't have any cart yet!");
    }

    try {
      await this.cartItemsRepository.remove(cart.cartItems);
      await this.cartsRepository.remove(cart);
      this.logger.log(`Cleared cart for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup cart for user ${userId}: ${error}`);
    }
  }

  /**
   * Send order confirmation email to the user
   * @param order - The order to send confirmation for
   */
  private async sendOrderConfirmationEmail(order: Order): Promise<void> {
    const FindSettings = await this.settingsRepository.find();
    const settings = FindSettings[0];
    try {
      await this.mailService.sendOrderConfirmation(order, settings);
      this.logger.log(`Order confirmation email sent for order ${order.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email for order ${order.id}: ${error}`,
      );
      // Don't throw - this shouldn't block the webhook processing
    }
  }
}
