import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  MaxDate,
} from 'class-validator';
import { GenderType } from 'src/utils/enums';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  @IsOptional()
  name?: string;

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
