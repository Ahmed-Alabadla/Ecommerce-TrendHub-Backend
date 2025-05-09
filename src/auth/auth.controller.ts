import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { UserType } from 'src/utils/enums';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { JWTPayload } from 'src/utils/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @method POST
   * @route ~/api/auth/register
   * @access Public
   */
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  /**
   * @method POST
   * @route ~/api/auth/login
   * @access Public
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  /**
   * @method POST
   * @route ~/api/auth/app/forgot-password
   * @access Public
   */
  @Post('app/forgot-password')
  @HttpCode(HttpStatus.OK)
  appForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email, 'app');
  }

  /**
   * @method POST
   * @route ~/api/auth/dashboard/forgot-password
   * @access Public
   */
  @Post('dashboard/forgot-password')
  @HttpCode(HttpStatus.OK)
  dashboardForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(
      forgotPasswordDto.email,
      'dashboard',
    );
  }

  /**
   * @method POST
   * @route ~/api/auth/reset-password
   * @access Public
   */
  @Post('reset-password')
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() request: Request,
  ) {
    const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;

    return this.authService.resetPassword(
      resetPasswordDto.userId,
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
      fullUrl,
    );
  }

  /**
   * @method POST
   * @route ~/api/auth/verify-email/:id/:verificationToken
   * @access Public
   */
  @Get('verify-email/:id/:verificationToken')
  verifyEmail(
    @Param('id', ParseIntPipe) id: number,
    @Param('verificationToken') verificationToken: string,
  ) {
    return this.authService.verifyEmail(id, verificationToken);
  }

  /**
   * @method PATCH
   * @route ~/api/auth/change-password
   * @access Private {Admin, Customer} logged in system
   */
  @Patch('change-password')
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN, UserType.CUSTOMER)
  changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() payload: JWTPayload,
  ) {
    return this.authService.changePassword(body, payload.id);
  }
}
