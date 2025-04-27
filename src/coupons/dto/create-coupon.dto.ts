import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
  MinDate,
} from 'class-validator';
import { CouponType } from 'src/utils/enums';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  code: string;

  @IsNumber()
  @Min(0)
  discount: number;

  @IsDate()
  @MinDate(new Date())
  @Type(() => Date)
  expirationDate: Date;

  @IsEnum(CouponType)
  type: CouponType;

  @IsInt()
  @Min(1)
  maxUsage: number;
}
