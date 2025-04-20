import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from './entities/sub-category.entity';
import { ILike, Repository } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class SubCategoriesService {
  constructor(
    @InjectRepository(SubCategory)
    private readonly subCategoryRepository: Repository<SubCategory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Create a new sub-category in the database
   * @param createSubCategoryDto data for creating a new sub-category
   * @returns created sub-category
   */
  async create(createSubCategoryDto: CreateSubCategoryDto) {
    const { categoryId, name, slug } = createSubCategoryDto;

    // Check if the category exists
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category)
      throw new BadRequestException(`Category with ID ${categoryId} not found`);

    // Check if the sub-category already exists
    const existingSubCategory = await this.subCategoryRepository.findOne({
      where: [{ slug: slug.toLowerCase() }, { name: ILike(name) }],
    });

    // If the sub-category already exists and has a category, throw an error
    if (existingSubCategory) {
      if (existingSubCategory.category) {
        throw new BadRequestException(
          'Sub-category already exists in this category',
        );
      } else {
        await this.subCategoryRepository.update(existingSubCategory.id, {
          category,
        });
        return existingSubCategory;
      }
    }

    const subCategory = this.subCategoryRepository.create({
      name,
      slug: slug.toLowerCase(),
      category,
    });

    return await this.subCategoryRepository.save(subCategory);
  }

  /**
   * Finds all sub-categories in database
   * @returns list of sub-categories
   */
  async findAll() {
    const subCategories = await this.subCategoryRepository.find({
      order: { createAt: 'DESC' },
    });
    return subCategories;
  }

  /**
   * Find a sub-category by Id in the database
   * @param id  sub-category Id
   * @returns sub-category with the specified Id
   */
  async findOne(id: number) {
    const subCategory = await this.subCategoryRepository.findOne({
      where: { id },
    });
    if (!subCategory)
      throw new BadRequestException(`SubCategory with ID ${id} not found`);

    return subCategory;
  }

  /**
   * Updates a sub-category by Id in the database.
   * @param id sub-category Id
   * @param updateCategoryDto  data for updating the sub-category
   * @returns updated sub-category
   */
  async update(id: number, updateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.findOne(id);

    if (updateSubCategoryDto.slug)
      updateSubCategoryDto.slug = updateSubCategoryDto.slug.toLowerCase();

    Object.assign(subCategory, updateSubCategoryDto);

    return await this.subCategoryRepository.save(subCategory);
  }

  /**
   * Remove a sub-category by Id from the database
   * @param id sub-category Id
   * @returns confirmation message
   */
  async remove(id: number) {
    const subCategory = await this.findOne(id);

    await this.subCategoryRepository.remove(subCategory);

    return { message: 'SubCategory deleted successfully!' };
  }
}
