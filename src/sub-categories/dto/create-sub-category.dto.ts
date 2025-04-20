import { IsInt, IsNotEmpty, IsString, Length, Min } from 'class-validator';

export class CreateSubCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  slug: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  categoryId: number;
}
