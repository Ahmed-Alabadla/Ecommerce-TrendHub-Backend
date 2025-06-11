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
import { Category } from '../categories/entities/category.entity';
import { SubCategory } from '../sub-categories/entities/sub-category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ProductStatus } from '../utils/enums';
import { ProductFilterDto } from './dto/filter-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

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

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create a new product in the database
   * @param createProductDto data for creating a new product
   * @param imageCover image cover for the product
   * @param images additional images for the product
   * @returns created product
   */
  async create(
    createProductDto: CreateProductDto,
    imageCover?: Express.Multer.File,
    images?: Express.Multer.File[],
  ) {
    if (imageCover) {
      try {
        const uploadResponse =
          await this.cloudinaryService.uploadImages(imageCover);
        createProductDto.imageCover = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    if (images) {
      try {
        const uploadResponse =
          await this.cloudinaryService.uploadImages(images);
        createProductDto.images = Array.isArray(uploadResponse)
          ? uploadResponse
          : [uploadResponse];
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

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
      categories,
      subcategories,
      brands,
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
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      includeInactive = false,
    } = filterDto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoin('product.reviews', 'reviews')
      .select([
        'product',
        'category',
        'subCategory',
        'brand',
        // 'reviews',
      ]);

    // Filter by search term
    if (search) {
      query.andWhere(
        `to_tsvector('english', product.name) @@ to_tsquery('english', :search) OR 
         to_tsvector('english', product.description) @@ to_tsquery('english', :search)`,
        { search: `${search}:*` },
      );
    }

    // Filter by categories
    if (categories && categories.length > 0 && categories[0] !== undefined) {
      const categoryIds = categories
        .filter((cat) => !isNaN(Number(cat)))
        .map(Number);
      const categorySlugs = categories.filter((cat) => isNaN(Number(cat)));

      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (categoryIds.length > 0) {
        conditions.push('category.id IN (:...categoryIds)');
        params.categoryIds = categoryIds;
      }

      if (categorySlugs.length > 0) {
        conditions.push('category.slug IN (:...categorySlugs)');
        params.categorySlugs = categorySlugs;
      }

      if (conditions.length > 0) {
        query.andWhere(`(${conditions.join(' OR ')})`, params);
      }
    }

    // Filter by subcategories
    if (
      subcategories &&
      subcategories.length > 0 &&
      subcategories[0] !== undefined
    ) {
      const subcategoryIds = subcategories
        .filter((sub) => !isNaN(Number(sub)))
        .map(Number);
      const subcategorySlugs = subcategories.filter((sub) =>
        isNaN(Number(sub)),
      );

      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (subcategoryIds.length > 0) {
        conditions.push('subCategory.id IN (:...subcategoryIds)');
        params.subcategoryIds = subcategoryIds;
      }

      if (subcategorySlugs.length > 0) {
        conditions.push('subCategory.slug IN (:...subcategorySlugs)');
        params.subcategorySlugs = subcategorySlugs;
      }

      if (conditions.length > 0) {
        query.andWhere(`(${conditions.join(' OR ')})`, params);
      }
    }

    // Filter by brands
    if (brands && brands.length > 0 && brands[0] !== undefined) {
      const brandIds = brands
        .filter((brand) => !isNaN(Number(brand)))
        .map(Number);
      const brandSlugs = brands.filter((brand) => isNaN(Number(brand)));

      const conditions: string[] = [];
      const params: Record<string, any> = {};

      if (brandIds.length > 0) {
        conditions.push('brand.id IN (:...brandIds)');
        params.brandIds = brandIds;
      }

      if (brandSlugs.length > 0) {
        conditions.push('brand.slug IN (:...brandSlugs)');
        params.brandSlugs = brandSlugs;
      }

      if (conditions.length > 0) {
        query.andWhere(`(${conditions.join(' OR ')})`, params);
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

    // For rating filters, we need to modify the query structure
    if (
      ratingAverage_gt ||
      ratingAverage_gte ||
      ratingAverage_lt ||
      ratingAverage_lte
    ) {
      query
        .addSelect('AVG(reviews.rating)', 'averageRating')
        .groupBy('product.id, category.id, subCategory.id, brand.id')
        .having('AVG(reviews.rating) IS NOT NULL');

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
    }

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
   * @param imageCover image cover for the product
   * @param images additional images for the product
   * @returns updated product
   */
  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    imageCover?: Express.Multer.File,
    newImagesFiles?: Express.Multer.File[],
  ) {
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

    if (imageCover) {
      if (product.imageCover) {
        const publicId =
          product.imageCover.split('/').pop()?.split('.')[0] ?? '';
        await this.cloudinaryService.deleteImages(publicId);
      }
      try {
        const uploadResponse =
          await this.cloudinaryService.uploadImages(imageCover);
        updateProductDto.imageCover = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Determine images to delete (in product but not in DTO)
    const imagesToDelete = product.images?.filter(
      (existingImage) => !updateProductDto.images?.includes(existingImage),
    );

    // Delete old images from Cloudinary
    if (imagesToDelete.length > 0) {
      const publicIds: string[] = [];
      imagesToDelete.map((image) => {
        const publicId = image.split('/').pop()?.split('.')[0] ?? '';
        publicIds.push(publicId);
      });

      await this.cloudinaryService.deleteImages(publicIds);
    }

    // Upload new images if provided
    let uploadedImages: string[] = [];

    if (newImagesFiles) {
      // Upload new images to Cloudinary
      try {
        const uploadResponse =
          await this.cloudinaryService.uploadImages(newImagesFiles);
        uploadedImages = Array.isArray(uploadResponse)
          ? uploadResponse
          : [uploadResponse];
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    //Combine kept and new images
    const keptImages = product.images?.filter((existingImage) =>
      updateProductDto.images?.includes(existingImage),
    );

    updateProductDto.images = [
      ...(keptImages || []),
      ...(uploadedImages || []),
    ];
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
