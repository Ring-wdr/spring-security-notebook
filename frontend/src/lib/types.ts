export type TokenPairResponse = {
  grantType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export type CurrentUser = {
  email: string;
  nickname: string;
  social: boolean;
  roleNames: string[];
};

export type StoredSession = {
  tokens: TokenPairResponse;
  user: CurrentUser | null;
};

export type ContentSummary = {
  id: number;
  title: string;
  category: string;
  published: boolean;
};

export type ContentDetail = {
  id: number;
  title: string;
  body: string;
  category: string;
  published: boolean;
};

export type SubscriberSummary = {
  email: string;
  nickname: string;
  social: boolean;
  roleNames: string[];
};
