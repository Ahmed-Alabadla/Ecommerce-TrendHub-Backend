import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { UserType } from '../utils/enums';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { Roles } from '../users/decorators/user-role.decorator';

@Controller('coupons')
@UseGuards(AuthRolesGuard)
@Roles(UserType.ADMIN)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * @method POST
   * @route ~/api/coupons
   * @access Private [Admin]
   */
  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  /**
   * @method GET
   * @route ~/api/coupons
   * @access Private [Admin]
   */
  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  /**
   * @method GET
   * @route ~/api/coupons
   * @access Private [Admin]
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.findOne(id);
  }

  /**
   * @method PATCH
   * @route ~/api/coupons
   * @access Private [Admin]
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, updateCouponDto);
  }

  /**
   * @method DELETE
   * @route ~/api/coupons
   * @access Private [Admin]
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.remove(id);
  }
}
