import { IsHexColor, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCartDto {
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
