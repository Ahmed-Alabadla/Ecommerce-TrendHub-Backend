import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  slug: string;

  @IsOptional()
  @IsString()
  image?: string;
}
