import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsBooleanString,
} from 'class-validator';

export class CreateSettingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  store_name?: string;

  @IsOptional()
  @IsEmail()
  @MinLength(3)
  @MaxLength(255)
  store_email?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber(undefined, {
    message:
      'phone must be a valid international number with country code (e.g., +970597762451)',
  })
  store_phone?: string;

  @IsOptional()
  @IsString()
  store_address?: string;

  @IsOptional()
  @IsString()
  store_logo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99.99)
  @Transform(({ value }) => Number(value))
  tax_rate?: number;

  @IsOptional()
  @IsBooleanString()
  tax_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99.99)
  @Transform(({ value }) => Number(value))
  shipping_rate?: number;

  @IsOptional()
  @IsBooleanString()
  shipping_enabled?: boolean;
}
