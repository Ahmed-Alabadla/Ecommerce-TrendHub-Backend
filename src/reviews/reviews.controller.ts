import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CurrentUser } from '../users/decorators/current-user.decorator';
import { JWTPayload } from '../utils/types';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserType } from '../utils/enums';
import { ReviewFilterDto } from './dto/review-filter.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * @method POST
   * @route ~/api/reviews/:productId
   * @access Private [Admin, Customer]
   */
  @Post(':productId')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.reviewsService.create(productId, createReviewDto, payload.id);
  }

  /**
   * @method GET
   * @route ~/api/reviews
   * @access Public
   */
  @Get()
  findAll(@Query() filterDto: ReviewFilterDto) {
    return this.reviewsService.findAll(filterDto);
  }

  /**
   * @method GET
   * @route ~/api/reviews/:id
   * @access Public
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  /**
   * @method PATCH
   * @route ~/api/reviews/:id
   * @access Private [User who created it]
   */
  @Patch(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.reviewsService.update(id, updateReviewDto, payload);
  }

  /**
   * @method DELETE
   * @route ~/api/reviews/:id
   * @access Private [Admin, Customer]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.reviewsService.remove(id, payload);
  }
}
