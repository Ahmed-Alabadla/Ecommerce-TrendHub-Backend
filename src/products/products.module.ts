import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { SubCategory } from 'src/sub-categories/entities/sub-category.entity';
import { Brand } from 'src/brands/entities/brand.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Product, Category, SubCategory, Brand]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
