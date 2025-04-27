import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  /**
   * Create a new coupon in the database
   * @param createCouponDto data for creating a new coupon
   * @returns created coupon
   */
  async create(createCouponDto: CreateCouponDto) {
    const existingCoupon = await this.couponsRepository.findOne({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) throw new BadRequestException('Coupon already exist!');

    const coupon = this.couponsRepository.create({ ...createCouponDto });

    return await this.couponsRepository.save(coupon);
  }

  /**
   * Finds all coupons in database
   * @returns list of coupons
   */
  async findAll() {
    const coupons = await this.couponsRepository.find({
      order: { createAt: 'DESC' },
    });
    return coupons;
  }

  /**
   * Find a coupon by Id in the database
   * @param id  coupon Id
   * @returns coupon with the specified Id
   */
  async findOne(id: number) {
    const coupon = await this.couponsRepository.findOne({
      where: { id },
    });

    if (!coupon) throw new NotFoundException(`Coupon with Id ${id} not found!`);

    return coupon;
  }

  /**
   * Updates a coupon by Id in the database.
   * @param id coupon Id
   * @param updateCouponDto  data for updating the coupon
   * @returns updated coupon
   */
  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.findOne(id);

    Object.assign(coupon, updateCouponDto);

    return await this.couponsRepository.save(coupon);
  }

  /**
   * Remove a coupon by Id from the database
   * @param id coupon Id
   * @returns confirmation message
   */
  async remove(id: number) {
    const coupon = await this.findOne(id);

    await this.couponsRepository.remove(coupon);
    return { message: 'Coupon deleted successfully!' };
  }
}
