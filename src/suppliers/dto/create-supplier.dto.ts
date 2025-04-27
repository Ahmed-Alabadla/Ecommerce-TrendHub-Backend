import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateSupplierDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 150)
  @IsEmail()
  email: string;

  @IsUrl()
  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  @IsPhoneNumber(undefined, {
    message:
      'phone must be a valid international number with country code (e.g., +970597762451)',
  })
  phone?: string;
}
