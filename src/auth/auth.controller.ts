import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';

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
}
