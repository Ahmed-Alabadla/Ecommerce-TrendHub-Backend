import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 100) // Assuming street names are at least 5 characters and at most 100
  street: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50) // Assuming country names are at least 2 characters and at most 50
  country: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50) // Assuming city names are at least 2 characters and at most 50
  city: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(5) // Assuming postal codes are at least 5 digits
  postalCode: number;
}
