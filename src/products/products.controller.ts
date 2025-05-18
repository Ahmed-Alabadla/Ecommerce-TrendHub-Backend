import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { UserType } from 'src/utils/enums';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { ProductFilterDto } from './dto/filter-product.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * @method POST
   * @route ~/api/products
   * @access Private [Admin]
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      {
        limits: {
          fileSize: 2 * 1024 * 1024, // 2MB per file
          files: 6, // 1 cover + 5 images max
        },
        fileFilter: (req, file, cb) => {
          const validTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/jpg',
          ];
          if (validTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(`Invalid file type: ${file.mimetype}`),
              false,
            );
          }
        },
      },
    ),
  )
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      imageCover?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    return this.productsService.create(
      createProductDto,
      files.imageCover?.[0],
      files.images,
    );
  }

  /**
   * @method GET
   * @route ~/api/products
   * @access Public
   */
  @Get()
  findAll(@Query() filterDto: ProductFilterDto) {
    return this.productsService.findAll(filterDto);
  }

  /**
   * @method GET
   * @route ~/api/products/:id
   * @access Public
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * @method PATCH
   * @route ~/api/products/:id
   * @access Private [Admin]
   */
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 5 },
      ],
      {
        limits: {
          fileSize: 2 * 1024 * 1024, // 2MB per file
          files: 6, // 1 cover + 5 images max
        },
        fileFilter: (req, file, cb) => {
          const validTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/jpg',
          ];
          if (validTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(`Invalid file type: ${file.mimetype}`),
              false,
            );
          }
        },
      },
    ),
  )
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      imageCover?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      files.imageCover?.[0],
      files.images,
    );
  }

  /**
   * @method DELETE
   * @route ~/api/products/:id
   * @access Private [Admin]
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
