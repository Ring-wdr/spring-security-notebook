import type {
  ContentDetailResponse,
  ContentSummaryResponse,
  CurrentUserResponse,
  SubscriberSummaryResponse,
  TokenPairResponse as GeneratedTokenPairResponse,
} from "@/generated/openapi/src/models";

export type TokenPairResponse = GeneratedTokenPairResponse;

export type CurrentUser = CurrentUserResponse;

export type StoredSession = {
  tokens: TokenPairResponse;
  user: CurrentUser | null;
};

export type ContentSummary = ContentSummaryResponse;

export type ContentDetail = ContentDetailResponse;

export type SubscriberSummary = SubscriberSummaryResponse;
