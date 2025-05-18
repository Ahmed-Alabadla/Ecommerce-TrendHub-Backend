import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  slug: string;

  @IsOptional()
  @IsString()
  image?: string;
}
