import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class ReviewFilterDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsNumber()
  productId?: number;
}
