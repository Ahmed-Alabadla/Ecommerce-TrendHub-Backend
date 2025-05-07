import {
  IsArray,
  IsEnum,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { ProductStatus } from 'src/utils/enums';
import { Dimensions } from '../entities/dimensions.entity';
import { Transform } from 'class-transformer';

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
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  priceAfterDiscount?: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageCover: string;

  @IsArray()
  @IsUrl({}, { each: true })
  images: string[];

  @IsArray()
  @IsHexColor({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((color: string) =>
          color.startsWith('#') ? color : `#${color}`,
        )
      : ([] as string[]),
  )
  colors: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsOptional()
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
  categoryId: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  subCategoryId?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  brandId?: number;
}
