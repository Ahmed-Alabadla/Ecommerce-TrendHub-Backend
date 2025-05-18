import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { ProductStatus } from 'src/utils/enums';
// import { Dimensions } from '../entities/dimensions.entity';
import { Transform, Type } from 'class-transformer';
class Dimensions {
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  length: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  width: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  height: number;
}
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  quantity: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => Number(value))
  priceAfterDiscount?: number;

  @IsString()
  @IsNotEmpty()
  // @IsUrl()
  @IsOptional()
  imageCover?: string;

  // @IsArray()
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => Number(value))
  weight?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as Dimensions)
      : (value as Dimensions),
  )
  @Type(() => Dimensions)
  dimensions?: Dimensions;

  @IsOptional()
  @IsString()
  @Matches(/^[\d]+ (year|month)s?$/i, {
    message: 'Warranty must be in the format: "1 year" or "6 months"',
  })
  warranty?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  categoryId: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => Number(value))
  subCategoryId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => Number(value))
  brandId?: number;
}
