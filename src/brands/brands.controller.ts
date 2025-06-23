import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserType } from '../utils/enums';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  /**
   * @method POST
   * @route ~/api/brands
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @Post()
  create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({
            fileType: 'image/(jpeg|png|gif|jpg|webp)',
          }), // More specific
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.brandsService.create(createBrandDto, file);
  }

  /**
   * @method GET
   * @route ~/api/brands
   * @access Public
   */
  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  /**
   * @method GET
   * @route ~/api/brands/:id
   * @access Public
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  /**
   * @method PATCH
   * @route ~/api/brands/:id
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: 'image/(jpeg|png|gif|jpg|webp)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.brandsService.update(id, updateBrandDto, file);
  }

  /**
   * @method DELETE
   * @route ~/api/brands/:id
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.remove(id);
  }
}
