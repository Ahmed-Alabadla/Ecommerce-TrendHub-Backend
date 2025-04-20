import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Create a new category in the database
   * @param createCategoryDto data for creating a new category
   * @returns created category
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug, image } = createCategoryDto;

    const existingCategory = await this.categoriesRepository.findOne({
      where: [{ slug: slug.toLowerCase() }, { name: ILike(name) }],
    });
    if (existingCategory)
      throw new BadRequestException('Category already exist!');

    const category = this.categoriesRepository.create({
      name,
      slug: slug.toLowerCase(),
      image,
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
      order: { createAt: 'DESC' },
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
   * @returns updated category
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (updateCategoryDto.slug)
      updateCategoryDto.slug = updateCategoryDto.slug.toLowerCase();

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
    await this.categoriesRepository.remove(category);
    return { message: 'Category deleted successfully!' };
  }
}
