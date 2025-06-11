import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { JWTPayload } from '../utils/types';
import { UserType } from '../utils/enums';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /**
   * Create a new review in the database
   * @param productId id of the product
   * @param createReviewDto data for creating a new review
   * @param userId id of the user
   * @returns created review
   */
  async create(
    productId: number,
    createReviewDto: CreateReviewDto,
    userId: number,
  ) {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });
    if (!product)
      throw new NotFoundException(`Product with Id ${productId} not found!`);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with Id ${userId} not found!`);

    const existingReview = await this.reviewsRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });
    if (existingReview)
      throw new BadRequestException('You have already reviewed this product!');

    const review = this.reviewsRepository.create({
      ...createReviewDto,
      user,
      product,
    });

    const result = await this.reviewsRepository.save(review);

    // update average ratings for product
    await this.calculateAverageRating(product);

    return result;
  }

  /**
   * Find all reviews in the database
   * @param filterDto filter options for reviews
   * @returns list of reviews
   */
  async findAll(filterDto: ReviewFilterDto) {
    const { page = 1, limit = 10, productId } = filterDto;

    const skip = (page - 1) * limit;

    const filters = {
      ...(productId ? { product: { id: productId } } : {}),
    };

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: filters,
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    const totalPages =
      Math.ceil(total / limit) === 0 ? 1 : Math.ceil(total / limit);

    return {
      data: reviews,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: totalPages,
      },
    };
  }

  /**
   * Find a review by Id in the database
   * @param id  review Id
   * @returns review with the specified Id
   */
  async findOne(id: number) {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['product', 'user'],
    });
    if (!review) throw new NotFoundException(`Review with Id ${id} not found!`);

    return review;
  }

  /**
   * Update a review by Id in the database
   * @param id review Id
   * @param updateReviewDto data for updating the review
   * @param payload Current user logged
   * @returns updated review
   */
  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
    payload: JWTPayload,
  ) {
    const review = await this.findOne(id);

    if (review.user.id !== payload.id) {
      throw new UnauthorizedException('You not allow to update this review!');
    }

    Object.assign(review, updateReviewDto);

    const result = await this.reviewsRepository.save(review);

    await this.calculateAverageRating(result.product);
    return result;
  }

  /**
   * Make a review by Id Incomplete in the database
   * @param id review Id
   * @param payload Current user logged
   * @returns confirmation message
   */
  async remove(id: number, payload: JWTPayload) {
    const review = await this.findOne(id);

    if (
      review.user.id !== payload.id &&
      payload.userType !== (UserType.ADMIN as string)
    ) {
      throw new UnauthorizedException('You not allow to delete this review!');
    }

    await this.reviewsRepository.remove(review);

    // ======= update rating average for product =======

    await this.calculateAverageRating(review.product);

    return { message: `Review with ID ${id} has been deleted` };
  }

  /**
   *
   */
  private async calculateAverageRating(product: Product) {
    const [reviews, count] = await this.reviewsRepository.findAndCount({
      where: { product: { id: product.id } },
    });

    if (count > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      const ratingsAverage = sum / count;

      await this.productsRepository.update(product.id, {
        ratingsAverage,
        ratingsQuantity: count,
      });
    }
  }
}
