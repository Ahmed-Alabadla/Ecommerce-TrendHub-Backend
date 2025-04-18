import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @MinLength(6)
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
  //   message: 'Password too weak'
  // })
  newPassword: string;
}
