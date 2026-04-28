/* tslint:disable */
/* eslint-disable */
/**
 * 
 * @export
 * @interface ContentDetailResponse
 */
export interface ContentDetailResponse {
    /**
     * 
     * @type {number}
     * @memberof ContentDetailResponse
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof ContentDetailResponse
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof ContentDetailResponse
     */
    body: string;
    /**
     * 
     * @type {string}
     * @memberof ContentDetailResponse
     */
    category: string;
    /**
     * 
     * @type {boolean}
     * @memberof ContentDetailResponse
     */
    published: boolean;
}
/**
 * 
 * @export
 * @interface ContentSummaryResponse
 */
export interface ContentSummaryResponse {
    /**
     * 
     * @type {number}
     * @memberof ContentSummaryResponse
     */
    id: number;
    /**
     * 
     * @type {string}
     * @memberof ContentSummaryResponse
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof ContentSummaryResponse
     */
    category: string;
    /**
     * 
     * @type {boolean}
     * @memberof ContentSummaryResponse
     */
    published: boolean;
}
/**
 * 
 * @export
 * @interface ContentUpsertRequest
 */
export interface ContentUpsertRequest {
    /**
     * 
     * @type {string}
     * @memberof ContentUpsertRequest
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof ContentUpsertRequest
     */
    body: string;
    /**
     * 
     * @type {string}
     * @memberof ContentUpsertRequest
     */
    category: string;
    /**
     * 
     * @type {boolean}
     * @memberof ContentUpsertRequest
     */
    published: boolean;
}
/**
 * 
 * @export
 * @interface CurrentUserResponse
 */
export interface CurrentUserResponse {
    /**
     * 
     * @type {string}
     * @memberof CurrentUserResponse
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof CurrentUserResponse
     */
    nickname: string;
    /**
     * 
     * @type {boolean}
     * @memberof CurrentUserResponse
     */
    social: boolean;
    /**
     * 
     * @type {Array<string>}
     * @memberof CurrentUserResponse
     */
    roleNames: Array<string>;
}
/**
 * 
 * @export
 * @interface RefreshTokenRequest
 */
export interface RefreshTokenRequest {
    /**
     * 
     * @type {string}
     * @memberof RefreshTokenRequest
     */
    refreshToken: string;
}
/**
 * 
 * @export
 * @interface SubscriberSummaryResponse
 */
export interface SubscriberSummaryResponse {
    /**
     * 
     * @type {string}
     * @memberof SubscriberSummaryResponse
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof SubscriberSummaryResponse
     */
    nickname: string;
    /**
     * 
     * @type {boolean}
     * @memberof SubscriberSummaryResponse
     */
    social: boolean;
    /**
     * 
     * @type {Array<string>}
     * @memberof SubscriberSummaryResponse
     */
    roleNames: Array<string>;
}
/**
 * 
 * @export
 * @interface TokenPairResponse
 */
export interface TokenPairResponse {
    /**
     * 
     * @type {string}
     * @memberof TokenPairResponse
     */
    grantType: string;
    /**
     * 
     * @type {string}
     * @memberof TokenPairResponse
     */
    accessToken: string;
    /**
     * 
     * @type {string}
     * @memberof TokenPairResponse
     */
    refreshToken: string;
    /**
     * 
     * @type {number}
     * @memberof TokenPairResponse
     */
    accessTokenExpiresIn: number;
    /**
     * 
     * @type {number}
     * @memberof TokenPairResponse
     */
    refreshTokenExpiresIn: number;
}
/**
 * 
 * @export
 * @interface UpdateSubscriberRolesRequest
 */
export interface UpdateSubscriberRolesRequest {
    /**
     * 
     * @type {Array<string>}
     * @memberof UpdateSubscriberRolesRequest
     */
    roleNames: Array<string>;
}
