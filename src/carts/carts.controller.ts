import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UserType } from 'src/utils/enums';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { JWTPayload } from 'src/utils/types';

@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  /**
   * @method POST
   * @route ~/api/cart/:productId
   * @access Private [Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Post(':productId')
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() payload: JWTPayload,
    @Body() createCartDto: CreateCartDto,
  ) {
    return this.cartsService.createCart(productId, payload.id, createCartDto);
  }

  /**
   * @method GET
   * @route ~/api/cart/all
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get('all')
  findAll() {
    return this.cartsService.findAllCarts();
  }

  /**
   * @method GET
   * @route ~/api/cart
   * @access Private [Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Get()
  findOne(@CurrentUser() payload: JWTPayload) {
    const { id } = payload;
    return this.cartsService.findOneByUser(id);
  }

  /**
   * @method DELETE
   * @route ~/api/cart
   * @access Private [Customer] who created it
   */
  @Delete()
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  remove(@CurrentUser() payload: JWTPayload) {
    return this.cartsService.removeCart(payload.id);
  }

  /**
   * @method POST
   * @route ~/api/cart/apply-coupon/:code
   * @access Private [Customer] who created it
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Post('apply-coupon/:code')
  applyCoupon(@Param('code') code: string, @CurrentUser() payload: JWTPayload) {
    return this.cartsService.applyCouponToCart(code, payload.id);
  }

  /**
   * @method DELETE
   * @route ~/api/cart/remove-coupon
   * @access Private [Customer] who created it
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.CUSTOMER)
  @Delete('remove-coupon')
  removeCoupon(@CurrentUser() payload: JWTPayload) {
    console.log('remove coupon', payload.id);

    return this.cartsService.removeCouponFromCart(payload.id);
  }
}
