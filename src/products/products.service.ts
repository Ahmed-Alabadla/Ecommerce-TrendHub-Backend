import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { SubCategory } from 'src/sub-categories/entities/sub-category.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { ProductStatus } from 'src/utils/enums';
import { ProductFilterDto } from './dto/filter-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,

    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  /**
   * Create a new product in the database
   * @param createProductDto data for creating a new product
   * @returns created product
   */
  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create(createProductDto);

    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.categoryId} not found`,
      );
    }
    product.category = category;

    // Check if the subcategory exists
    if (createProductDto.subCategoryId) {
      const subCategory = await this.subCategoryRepository.findOne({
        where: { id: createProductDto.subCategoryId },
        relations: ['category'],
      });
      if (!subCategory) {
        throw new NotFoundException(
          `Subcategory with ID ${createProductDto.subCategoryId} not found`,
        );
      }

      if (createProductDto.categoryId !== subCategory.category.id) {
        throw new BadRequestException(
          'Subcategory does not belong to the specified category',
        );
      }
      product.subCategory = subCategory;
    }

    // Check if the brand exists
    if (createProductDto.brandId) {
      const brand = await this.brandRepository.findOne({
        where: { id: createProductDto.brandId },
      });
      if (!brand) {
        throw new NotFoundException(
          `Brand with ID ${createProductDto.brandId} not found`,
        );
      }
      product.brand = brand;
    }

    return await this.productRepository.save(product);
  }

  /**
   * Find all products in the database
   * @param filterDto filter options for products
   * @returns list of products
   */
  async findAll(filterDto: ProductFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      subcategory,
      brand,
      sold_gt,
      sold_gte,
      sold_lt,
      sold_lte,
      price_gt,
      price_gte,
      price_lt,
      price_lte,
      ratingAverage_gt,
      ratingAverage_gte,
      ratingAverage_lt,
      ratingAverage_lte,
      sortBy = 'createAt',
      sortOrder = 'DESC',
      includeInactive = false,
    } = filterDto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .select([
        'product',
        'category.id',
        'category.name',
        'category.slug',
        'subCategory.id',
        'subCategory.name',
        'subCategory.slug',
        'brand.id',
        'brand.name',
        'brand.slug',
        // 'reviews',
      ])

      .groupBy('product.id, category.id, subCategory.id, brand.id, reviews.id');

    // Filter by search term
    if (search) {
      query.andWhere(
        `to_tsvector('english', product.name) @@ to_tsquery('english', :search) OR 
         to_tsvector('english', product.description) @@ to_tsquery('english', :search)`,
        { search: `${search}:*` },
      );
    }

    // Filter by category
    if (category) {
      if (typeof category === 'string' && !isNaN(Number(category))) {
        query.andWhere('category.id = :categoryId', {
          categoryId: Number(category),
        });
      } else {
        query.andWhere('category.slug = :categorySlug', {
          categorySlug: category,
        });
      }
    }

    // Filter by subcategory
    if (subcategory) {
      if (typeof subcategory === 'string' && !isNaN(Number(subcategory))) {
        query.andWhere('subCategory.id = :subcategoryId', {
          subcategoryId: Number(subcategory),
        });
      } else {
        query.andWhere('subCategory.slug = :subcategorySlug', {
          subcategorySlug: subcategory,
        });
      }
    }

    // Filter by brand
    if (brand) {
      if (typeof brand === 'string' && !isNaN(Number(brand))) {
        query.andWhere('brand.id = :brandId', {
          brandId: Number(brand),
        });
      } else {
        query.andWhere('brand.slug = :brandSlug', {
          brandSlug: brand,
        });
      }
    }

    // Filter by sold count
    if (sold_gt) query.andWhere('product.sold > :sold', { sold: sold_gt });
    if (sold_gte) query.andWhere('product.sold >= :sold', { sold: sold_gte });
    if (sold_lt) query.andWhere('product.sold < :sold', { sold: sold_lt });
    if (sold_lte) query.andWhere('product.sold <= :sold', { sold: sold_lte });

    // Filter by price
    if (price_gt) query.andWhere('product.price > :price_gt', { price_gt });
    if (price_gte) query.andWhere('product.price >= :price_gte', { price_gte });
    if (price_lt) query.andWhere('product.price < :price_lt', { price_lt });
    if (price_lte) query.andWhere('product.price <= :price_lte', { price_lte });

    // Filter by rating average
    if (ratingAverage_gt)
      query.andHaving('AVG(reviews.rating) > :ratingAverage_gt', {
        ratingAverage_gt,
      });
    if (ratingAverage_gte)
      query.andHaving('AVG(reviews.rating) >= :ratingAverage_gte', {
        ratingAverage_gte,
      });
    if (ratingAverage_lt)
      query.andHaving('AVG(reviews.rating) < :ratingAverage_lt', {
        ratingAverage_lt,
      });
    if (ratingAverage_lte)
      query.andHaving('AVG(reviews.rating) <= :ratingAverage_lte', {
        ratingAverage_lte,
      });

    // Filter by status
    if (!includeInactive) {
      query.andWhere('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
    }

    // Sorting
    query.orderBy(
      `product.${sortBy}`,
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    // Pagination
    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    const [products, total] = await query.getManyAndCount();
    const totalPages =
      Math.ceil(total / limit) === 0 ? 1 : Math.ceil(total / limit);

    return {
      data: products,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: totalPages,
      },
    };
  }

  /**
   * Find a product by Id in the database
   * @param id  product Id
   * @returns product with the specified Id
   */
  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'subCategory', 'brand'],
    });

    if (!product)
      throw new NotFoundException(`Product with ID ${id} not found`);

    return product;
  }

  /**
   * Update a product by Id in the database
   * @param id product Id
   * @param updateProductDto data for updating the product
   * @returns updated product
   */
  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    // Check if the category exists
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateProductDto.categoryId} not found`,
        );
      }
      product.category = category;
    }

    // Check if the subcategory exists
    if (updateProductDto.subCategoryId) {
      const subCategory = await this.subCategoryRepository.findOne({
        where: { id: updateProductDto.subCategoryId },
        relations: ['category'],
      });
      if (!subCategory) {
        throw new NotFoundException(
          `Subcategory with ID ${updateProductDto.subCategoryId} not found`,
        );
      }
      if (updateProductDto.categoryId !== subCategory.category.id) {
        throw new BadRequestException(
          'Subcategory does not belong to the specified category',
        );
      }
      product.subCategory = subCategory;
    }

    // Check if the brand exists
    if (updateProductDto.brandId) {
      const brand = await this.brandRepository.findOne({
        where: { id: updateProductDto.brandId },
      });
      if (!brand) {
        throw new NotFoundException(
          `Brand with ID ${updateProductDto.brandId} not found`,
        );
      }
      product.brand = brand;
    }

    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  /**
   * Make a product by Id Incomplete in the database
   * @param id product Id
   * @returns confirmation message
   */
  async remove(id: number) {
    const product = await this.findOne(id);

    product.status = ProductStatus.DISCONTINUED;
    await this.productRepository.save(product);
    return { message: `Product with ID ${id} has been discontinued` };
  }
}
