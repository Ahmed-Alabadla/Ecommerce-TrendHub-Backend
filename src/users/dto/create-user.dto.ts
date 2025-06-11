import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MaxDate,
  MinLength,
} from 'class-validator';
import { GenderType, UserType } from '../../utils/enums';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 150)
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserType)
  role?: UserType;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @MaxDate(new Date(), {
    message: 'Birth date cannot be today or in the future',
  })
  birth_date?: Date;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  @IsPhoneNumber(undefined, {
    message:
      'phone must be a valid international number with country code (e.g., +970597762451)',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  address?: string;

  @IsEnum(GenderType)
  @IsOptional()
  gender?: GenderType;
}
