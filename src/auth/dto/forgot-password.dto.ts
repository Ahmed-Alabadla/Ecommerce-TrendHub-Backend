import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @Length(6, 150)
  email: string;
}
