// google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { GoogleUserType } from 'src/utils/types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { emails, photos, displayName, provider, id } = profile;
    const user = {
      googleId: id,
      provider,

      email: emails?.[0].value,
      name: displayName,
      avatar: photos?.[0]?.value,
      isAccountVerified: emails?.[0].verified,
      accessToken,
      refreshToken,
    } as GoogleUserType;
    done(null, user);
    return user;
  }
}
