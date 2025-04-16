import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  MaxDate,
  MinLength,
} from 'class-validator';
import { GenderType, UserType } from 'src/utils/enums';

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
  @IsUrl()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsDate()
  @MaxDate(
    () => {
      const date = new Date();
      date.setDate(date.getDate() - 1); // Yesterday
      return date;
    },
    {
      message: 'Birth date cannot be today or in the future',
    },
  )
  @Type(() => Date)
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
  @Length(6, 255)
  address?: string;

  @IsEnum(GenderType)
  @IsOptional()
  gender?: GenderType;
}
