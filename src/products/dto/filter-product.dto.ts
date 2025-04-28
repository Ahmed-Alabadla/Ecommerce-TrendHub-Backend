import {
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductFilterDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  sold_gt?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  sold_gte?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  sold_lt?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  sold_lte?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  price_gt?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  price_gte?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  price_lt?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  price_lte?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  ratingAverage_gt?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  ratingAverage_gte?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  ratingAverage_lt?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value as string))
  @IsNumber()
  ratingAverage_lte?: number;

  @IsOptional()
  @IsIn(['price', 'sold', 'ratingAverage', 'createAt'])
  sortBy?: string = 'createAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  includeInactive?: boolean = false;
}
