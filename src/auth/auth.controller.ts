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
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request, Response } from 'express';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { UserType } from 'src/utils/enums';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { JWTPayload } from 'src/utils/types';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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

  /**
   * @method GET
   * @route ~/api/auth/google
   * @access Public
   * @description This route will redirect the user to the Google login page.
   * The user will be prompted to enter their Google credentials.
   */
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  /**
   * @method GET
   * @route ~/api/auth/google/callback
   * @access Public
   * @description This route will be called by Google after the user has logged in.
   * The user will be redirected to this route with a code that can be used to get the user's profile.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      // Process the Google login
      const authResult = await this.authService.googleLogin(req);

      const url =
        authResult.user.role === UserType.ADMIN
          ? `${this.configService.get<string>('DASHBOARD_FRONTEND_URL')}/auth/google`
          : `${this.configService.get<string>('APP_FRONTEND_URL')}/auth/google`;

      const redirectUrl = new URL(url);
      redirectUrl.searchParams.set('access_token', authResult.access_token);
      // redirectUrl.searchParams.set('refresh_token', authResult.refreshToken);
      // Redirect back to the original application
      return res.redirect(redirectUrl.toString());

      // =============================
    } catch (error: unknown) {
      // Check for returnTo or clientType parameter
      const returnTo = req.query.returnTo as string;
      const clientType = req.query.clientType as string;

      let errorRedirect: string = `${this.configService.get<string>('APP_FRONTEND_URL')}/auth/google`; // Default fallback URL

      if (returnTo) {
        errorRedirect = returnTo;
      } else if (clientType === 'admin') {
        errorRedirect = `${this.configService.get<string>('DASHBOARD_FRONTEND_URL')}/auth/google`;
      } else if (clientType === 'app') {
        errorRedirect = `${this.configService.get<string>('APP_FRONTEND_URL')}/auth/google`;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return res.redirect(
        `${errorRedirect}?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }
}
