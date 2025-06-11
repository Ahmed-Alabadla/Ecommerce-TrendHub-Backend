import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  Headers,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Roles } from '../users/decorators/user-role.decorator';
import { PaymentMethod, UserType } from '../utils/enums';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { JWTPayload } from '../utils/types';
import { Request } from 'express';

@Controller('order/checkout')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * @method POST
   * @route ~/api/order/checkout/:paymentMethod
   * @access Private [Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Post(':paymentMethod')
  create(
    @Param('paymentMethod') paymentMethod: PaymentMethod,
    @CurrentUser() payload: JWTPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new BadRequestException('Invalid payment method');
    }
    return this.ordersService.create(paymentMethod, payload.id, createOrderDto);
  }

  /**
   * @method PATCH
   * @route ~/api/order/checkout/:orderId
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Patch(':orderId')
  updatePaidStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.updatePaidStatusCash(orderId, updateOrderDto);
  }

  /**
   * @method POST
   * @route ~/api/order/checkout/stripe/webhook
   * @access Public
   */
  // stripe listen --forward-to localhost:8000/api/order/checkout/stripe/webhook
  @Post('stripe/webhook')
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new BadRequestException('Invalid stripe-signature header');
    }

    const payload = req.body as Buffer; // Raw body is preserved by the middleware
    if (!Buffer.isBuffer(payload)) {
      throw new BadRequestException('Request raw body is missing or invalid');
    }
    return this.ordersService.handleStripeWebhook(payload, signature);
  }

  /**
   * @method GET
   * @route ~/api/order/checkout/user
   * @access Private [Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Get('user')
  getAllOrdersByUser(@CurrentUser() payload: JWTPayload) {
    return this.ordersService.getAllOrdersByUser(payload.id);
  }

  /**
   * @method GET
   * @route ~/api/order/checkout/:userId
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get(':userId')
  getAllOrdersByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.ordersService.getAllOrdersByUser(userId);
  }

  /**
   * @method GET
   * @route ~/api/order/checkout/:id/user
   * @access Private [Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Get(':id/user')
  getOrderById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.ordersService.getOrderById(id, payload.id);
  }
}
