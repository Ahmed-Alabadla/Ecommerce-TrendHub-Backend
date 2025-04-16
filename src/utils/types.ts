export type JWTPayload = {
  id: number;
  userType: string;
};

export type AccessTokenType = {
  access_token: string;
};

export type QueriesFindAllUsers = {
  name?: string;
  email?: string;
  role?: string;

  page?: string;
  limit?: string;
};
