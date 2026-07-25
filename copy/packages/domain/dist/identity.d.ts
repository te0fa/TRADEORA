import { Money } from './money';
export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    nationalId?: string;
    phoneNumber?: string;
    isKycVerified: boolean;
    accountBalance: Money;
    keycloakSubject: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthSession {
    sessionId: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
    valkeyCacheNamespace: string;
    createdAt: Date;
}
export interface UserRegistrationDto {
    email: string;
    fullName: string;
    password?: string;
    nationalId?: string;
    phoneNumber?: string;
}
export interface AuthTokenClaims {
    sub: string;
    email: string;
    name: string;
    preferred_username?: string;
    realm_access?: {
        roles: string[];
    };
    iss: string;
    exp: number;
    iat: number;
}
