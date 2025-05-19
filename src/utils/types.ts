export type JWTPayload = {
  id: number;
  userType: string;
};

export type AccessTokenType = {
  access_token: string;
};

// export type RefreshTokenType = {
//   refresh_token: string;
// };

export type GoogleUserType = {
  googleId: string;
  provider: string;
  email: string;
  name: string;
  avatar: string;
  isAccountVerified: boolean;
  accessToken: string;
  refreshToken: string;
};
