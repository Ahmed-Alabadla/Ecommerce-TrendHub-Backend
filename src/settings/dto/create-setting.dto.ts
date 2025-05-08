import {
  IsString,
  IsOptional,
  IsEmail,
  IsNumber,
  IsBoolean,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  tax_rate?: number;

  @IsOptional()
  @IsBoolean()
  tax_enabled?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  shipping_rate?: number;

  @IsOptional()
  @IsBoolean()
  shipping_enabled?: boolean;
}
