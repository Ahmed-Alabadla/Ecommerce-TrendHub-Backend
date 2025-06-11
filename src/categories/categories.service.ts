import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { ILike, Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create a new category in the database
   * @param createCategoryDto data for creating a new category
   * @param file optional image file for the category
   * @returns created category
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const { name, slug } = createCategoryDto;

    const existingCategory = await this.categoriesRepository.findOne({
      where: [{ slug: slug.toLowerCase() }, { name: ILike(name) }],
    });
    if (existingCategory)
      throw new BadRequestException('Category already exist!');

    if (file) {
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        createCategoryDto.image = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const category = this.categoriesRepository.create({
      name,
      slug: slug.toLowerCase(),
      image: createCategoryDto.image,
    });

    return await this.categoriesRepository.save(category);
  }

  /**
   * Finds all categories in database
   * @param slug Finds categories by slug
   * @returns list of categories
   */
  async findAll(slug?: string) {
    const categories = await this.categoriesRepository.find({
      where: { slug: slug?.toLowerCase() },
      order: { createdAt: 'DESC' },
      relations: ['subCategories'],
    });
    return categories;
  }

  /**
   * Find a category by Id in the database
   * @param id  category Id
   * @returns category with the specified Id
   */
  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['subCategories'],
    });
    if (!category)
      throw new BadRequestException(`Category with ID ${id} not found`);

    return category;
  }

  /**
   * Updates a category by Id in the database.
   * @param id category Id
   * @param updateCategoryDto  data for updating the category
   * @param file optional image file for the category
   * @returns updated category
   */
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const category = await this.findOne(id);
    if (updateCategoryDto.slug)
      updateCategoryDto.slug = updateCategoryDto.slug.toLowerCase();

    if (file) {
      if (category.image) {
        const publicId = category.image.split('/').pop()?.split('.')[0] ?? '';
        await this.cloudinaryService.deleteImages(publicId);
      }
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        updateCategoryDto.image = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    Object.assign(category, updateCategoryDto);

    return await this.categoriesRepository.save(category);
  }

  /**
   * Remove a category by Id from the database
   * @param id category Id
   * @returns confirmation message
   */
  async remove(id: number) {
    const category = await this.findOne(id);
    if (category.image) {
      const publicId = category.image?.split('/').pop()?.split('.')[0] ?? '';
      await this.cloudinaryService.deleteImages(publicId);
    }
    await this.categoriesRepository.remove(category);
    return { message: 'Category deleted successfully!' };
  }
}
