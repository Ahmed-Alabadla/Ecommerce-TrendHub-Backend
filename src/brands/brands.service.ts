import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
  ) {}
  /**
   * Create a new brand in the database
   * @param createBrandDto data for creating a new brand
   * @returns created brand
   */
  async create(createBrandDto: CreateBrandDto) {
    const { name, slug, image } = createBrandDto;
    const existingBrand = await this.brandsRepository.findOne({
      where: [{ slug: slug.toLowerCase() }, { name: ILike(name) }],
    });
    if (existingBrand) throw new BadRequestException('Brand already exist!');

    const brand = this.brandsRepository.create({
      name,
      slug: slug.toLowerCase(),
      image,
    });

    return await this.brandsRepository.save(brand);
  }

  /**
   * Finds all brands in database
   * @param slug Finds brands by slug
   * @returns list of brands
   */
  async findAll(slug?: string) {
    const brands = await this.brandsRepository.find({
      where: { slug: slug?.toLowerCase() },
      order: { createAt: 'DESC' },
    });
    return brands;
  }

  /**
   * Find a brand by Id in the database
   * @param id  brand Id
   * @returns brand with the specified Id
   */
  async findOne(id: number) {
    const brand = await this.brandsRepository.findOne({
      where: { id },
    });
    if (!brand) throw new NotFoundException(`Brand with Id ${id} not found!`);
    return brand;
  }

  /**
   * Updates a brand by Id in the database.
   * @param id brand Id
   * @param updateBrandDto  data for updating the brand
   * @returns updated brand
   */
  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const brand = await this.findOne(id);

    if (updateBrandDto.slug)
      updateBrandDto.slug = updateBrandDto.slug.toLowerCase();

    Object.assign(brand, updateBrandDto);

    return await this.brandsRepository.save(brand);
  }

  /**
   * Deletes a brand by Id in the database.
   * @param id brand Id
   * @returns deleted brand
   */
  async remove(id: number) {
    const brand = await this.findOne(id);
    await this.brandsRepository.remove(brand);
    return { message: 'Brand deleted successfully!' };
  }
}
