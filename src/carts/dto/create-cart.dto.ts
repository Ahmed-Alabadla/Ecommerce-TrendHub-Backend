import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCartDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
