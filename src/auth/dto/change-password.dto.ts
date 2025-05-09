import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
  //   message: 'Password too weak'
  // })
  oldPassword: string;

  @IsString()
  @MinLength(6)
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
  //   message: 'Password too weak'
  // })
  newPassword: string;
}
