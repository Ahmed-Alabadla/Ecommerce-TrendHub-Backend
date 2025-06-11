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
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}
  /**
   * Create a new brand in the database
   * @param createBrandDto data for creating a new brand
   * @param file optional image file for the brand
   * @returns created brand
   */
  async create(createBrandDto: CreateBrandDto, file?: Express.Multer.File) {
    const { name, slug } = createBrandDto;
    const existingBrand = await this.brandsRepository.findOne({
      where: [{ slug: slug.toLowerCase() }, { name: ILike(name) }],
    });
    if (existingBrand) throw new BadRequestException('Brand already exist!');

    if (file) {
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        createBrandDto.image = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    const brand = this.brandsRepository.create({
      name,
      slug: slug.toLowerCase(),
      image: createBrandDto.image,
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
      order: { createdAt: 'DESC' },
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
   * @param file optional image file for the brand
   * @returns updated brand
   */
  async update(
    id: number,
    updateBrandDto: UpdateBrandDto,
    file?: Express.Multer.File,
  ) {
    const brand = await this.findOne(id);

    if (updateBrandDto.slug)
      updateBrandDto.slug = updateBrandDto.slug.toLowerCase();

    if (file) {
      if (brand.image) {
        const publicId = brand.image.split('/').pop()?.split('.')[0] ?? '';
        await this.cloudinaryService.deleteImages(publicId);
      }
      try {
        const uploadResponse = await this.cloudinaryService.uploadImages(file);
        updateBrandDto.image = Array.isArray(uploadResponse)
          ? uploadResponse[0]
          : uploadResponse;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload image: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

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
    if (brand.image) {
      const publicId = brand.image.split('/').pop()?.split('.')[0] ?? '';
      await this.cloudinaryService.deleteImages(publicId);
    }
    await this.brandsRepository.remove(brand);
    return { message: 'Brand deleted successfully!' };
  }
}
