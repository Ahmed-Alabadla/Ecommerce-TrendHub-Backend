import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from './../mail/mail.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import {
  GoogleUserType,
  JWTPayload,
  RefreshTokenPayload,
} from '../utils/types';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Request, Response } from 'express';
import { generateRandomPassword } from '../utils/util';
import { UserType } from '../utils/enums';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Create new user
   * @param body data for creating new user
   * @returns message successfully
   */
  async register(body: RegisterDto) {
    const { email, password, name } = body;

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    // Check if user already exists
    // If user exists and is not active, update the user and send verification email again
    if (existingUser) {
      if (existingUser.isActive) {
        throw new BadRequestException('User already exists!');
      } else {
        existingUser.name = name;
        existingUser.isActive = true;

        // Hash the password before saving
        const hashedPassword = await this.hashPassword(password);
        existingUser.password = hashedPassword;

        // Generate a new verification token and link
        existingUser.verificationToken = randomBytes(32).toString('hex');
        await this.usersRepository.save(existingUser);

        const link = this.generateLink(
          existingUser.id,
          existingUser.verificationToken,
        );

        await this.mailService.sendVerificationEmail(
          existingUser.email,
          existingUser.name,
          link,
        );
        return {
          message:
            'Verification token has been send to your email, Please verify your email address',
        };
      }
    }

    // Hash the password before saving
    const hashedPassword = await this.hashPassword(password);

    let newUser = this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
      verificationToken: randomBytes(32).toString('hex'),
    });
    newUser = await this.usersRepository.save(newUser);

    const link = this.generateLink(newUser.id, newUser.verificationToken!);
    await this.mailService.sendVerificationEmail(
      newUser.email,
      newUser.name,
      link,
    );

    return {
      message:
        'Verification token has been send to your email, Please verify your email address',
    };
  }

  /**
   * Login User
   * @param loginDto data for login to user account
   * @returns JWT (access_token, refresh_token)
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) throw new BadRequestException('Invalid email or password!');

    // Check if account is active
    if (!user.isActive) {
      throw new BadRequestException('Invalid email or password!');
    }

    // Check if match password
    const isMatchPassword = await bcrypt.compare(password, user.password);
    if (!isMatchPassword)
      throw new BadRequestException('Invalid email or password!');

    // Check user not verification your account
    if (!user.isAccountVerified) {
      let link: string;
      if (user.verificationToken) {
        link = this.generateLink(user.id, user.verificationToken);
      } else {
        user.verificationToken = randomBytes(32).toString('hex');
        await this.usersRepository.save(user);
        link = this.generateLink(user.id, user.verificationToken);
      }
      await this.mailService.sendVerificationEmail(user.email, user.name, link);

      return {
        message:
          'Verification token has been send to your email, Please verify your email address',
      };
    }

    // generate JWT Access Token
    const access_token = await this.generateAccessToken({
      id: user.id,
      userType: user.role,
    });

    // generate JWT Refresh Token
    const refresh_token = await this.generateRefreshToken({
      id: user.id,
      userType: user.role,
      usageCount: 0,
      maxUsage: 5,
    });

    return { access_token, refresh_token };
  }

  /**
   * Verify email
   * @param userId user id
   * @param verificationToken verification token
   * @returns message successfully
   */
  async verifyEmail(userId: number, verificationToken: string, res: Response) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, verificationToken },
    });
    if (!user) throw new BadRequestException('Invalid token!');

    // Update user account as verified
    user.isAccountVerified = true;
    user.verificationToken = null;

    await this.usersRepository.save(user);

    const url =
      user.role === UserType.ADMIN
        ? `${this.config.get<string>('DASHBOARD_FRONTEND_URL')}/auth/login`
        : `${this.config.get<string>('APP_FRONTEND_URL')}/auth/login`;

    const redirectUrl = new URL(url);
    redirectUrl.searchParams.set(
      'message',
      'Email verified successfully! Please login to your account.',
    );

    // Redirect to the frontend application
    return res.redirect(redirectUrl.toString());
  }

  /**
   * Send password reset link to user email
   * @param email user email
   * @param frontendType type of frontend (app or dashboard)
   * @returns message successfully
   */
  async forgotPassword(email: string) {
    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user)
      throw new BadRequestException(
        'If this email exists, you will receive a password reset link!',
      );

    // Generate and save token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes expiration

    const passwordResetToken = await this.passwordResetTokenRepository.save({
      user,
      token,
      expiresAt,
    });

    const expectedOrigin =
      user.role === UserType.ADMIN
        ? this.config.get<string>('DASHBOARD_FRONTEND_URL')
        : this.config.get<string>('APP_FRONTEND_URL');

    const link = `${expectedOrigin}/auth/reset-password?userId=${user.id}&token=${passwordResetToken.token}`;

    await this.mailService.sendResetPasswordEmail(user.email, user.name, link);

    return { message: 'Password reset link sent to your email' };
  }

  /**
   * Reset password
   * @param userId user id
   * @param token password reset token
   * @param newPassword new password
   * @param requestOrigin the url for this request
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { userId, token, newPassword } = resetPasswordDto;

    //  Find valid token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Verify user match
    if (resetToken.user.id !== userId) {
      throw new BadRequestException('Invalid token for this user');
    }

    // Update user password
    const hashedPassword = await this.hashPassword(newPassword);
    const user = await this.usersRepository.findOne({
      where: { id: resetToken.user.id },
    });
    if (!user) throw new BadRequestException('Invalid email or password!');
    user.password = hashedPassword;
    await this.usersRepository.save(user);

    //  Delete all user's reset tokens
    await this.passwordResetTokenRepository.delete({ user: resetToken.user });

    return { message: 'Password updated successfully' };
  }

  /**
   * Change password when user logged in system
   * @param changePasswordDto data for change password to user account
   * @param userId  id of user logged
   * @returns message successfully
   */
  async changePassword(changePasswordDto: ChangePasswordDto, userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with Id ${userId} not found!`);
    }

    const isMatchPassword = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isMatchPassword) throw new BadRequestException('Invalid password!');

    user.password = await this.hashPassword(changePasswordDto.newPassword);

    await this.usersRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  /**
   * Google login
   * @param user data from google
   * @returns JWT (access_token)
   */
  async googleLogin(req: Request) {
    // return true;
    const { name, email, avatar, isAccountVerified } =
      req.user as GoogleUserType;

    // Check if user exists
    let existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    // If user does not exist, create a new user
    if (!existingUser) {
      // generate random password and hash it
      const password = await this.hashPassword(generateRandomPassword());

      existingUser = this.usersRepository.create({
        name,
        email,
        avatar,
        isAccountVerified,
        password,
      });

      await this.usersRepository.save(existingUser);
    }
    if (!existingUser.isActive) existingUser.isActive = true;

    if (!existingUser.isAccountVerified) existingUser.isAccountVerified = true;

    await this.usersRepository.save(existingUser);

    // Generate JWT Token
    const access_token = await this.generateAccessToken({
      id: existingUser.id,
      userType: existingUser.role,
    });

    // generate JWT Refresh Token
    const refresh_token = await this.generateRefreshToken({
      id: existingUser.id,
      userType: existingUser.role,
      usageCount: 0,
      maxUsage: 5,
    });

    return { access_token, refresh_token, user: existingUser };
  }

  /**
   *
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Invalid token format');
    }
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.config.get<string>('JWT_SECRET_REFRESH'),
        },
      );

      if (payload.usageCount > payload.maxUsage) {
        throw new BadRequestException('Refresh token exceeded maximum usage');
      }

      console.log('========= Start Refresh Token =========');
      console.log({
        id: payload.id,
        userType: payload.userType,
        usageCount: payload.usageCount + 1,
        maxUsage: payload.maxUsage,
      });
      console.log('========= End Refresh Token =========');

      const newAccessToken = await this.generateAccessToken({
        id: payload.id,
        userType: payload.userType,
      });

      const updatedRefreshToken = await this.generateRefreshToken({
        id: payload.id,
        userType: payload.userType,
        usageCount: payload.usageCount + 1,
        maxUsage: payload.maxUsage,
      });

      return {
        access_token: newAccessToken,
        refresh_token: updatedRefreshToken,
      };
    } catch (err) {
      console.log(err);
      if (
        err instanceof UnauthorizedException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new UnauthorizedException('Access denied, Invalid Refresh Token!');
    }
  }

  /**
   * Generate Json Web Token
   * @param payload JWT payload
   * @returns access token
   */
  private generateAccessToken(payload: JWTPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  /**
   * Generate Json Web Token
   * @param payload JWT payload
   * @returns refresh token
   */
  private generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET_REFRESH'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN_REFRESH'),
    });
  }
  /**
   * Hash password
   * @param password password to hashed
   * @returns hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Generate email verification link
   */
  private generateLink(userId: number, verificationToken: string) {
    return `${this.config.get<string>('DOMAIN')}/api/auth/verify-email/${userId}/${verificationToken}`;
  }
}
