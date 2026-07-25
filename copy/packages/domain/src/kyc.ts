import { Money } from './money';

export type KYCState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING_RESUBMISSION'
  | 'EXPIRED';

export interface EgyptianNationalIDData {
  nationalIdNumber: string; // 14 digits
  fullNameArabic: string;
  dateOfBirth: string;
  governorate: string;
  gender: 'MALE' | 'FEMALE';
  expiryDate: string;
}

export interface LivenessResult {
  passed: boolean;
  confidenceScore: string; // Decimal string representation e.g. "0.9850"
  livenessSessionId: string;
  timestamp: string;
}

export interface AMLCheckResult {
  passed: boolean;
  matchScore: string; // Decimal string representation e.g. "0.0000" or "0.8500"
  sanctionsListsChecked: string[]; // ['OFAC', 'UN_SANCTIONS', 'CBE_BLACK_LIST']
  matchedEntities: Array<{
    listName: string;
    entityName: string;
    score: string;
  }>;
  checkedAt: string;
}

export interface KYCApplication {
  id: string;
  userId: string;
  state: KYCState;
  nationalIdData?: EgyptianNationalIDData;
  livenessResult?: LivenessResult;
  amlCheckResult?: AMLCheckResult;
  sumsubApplicantId?: string;
  fraConsentAcknowledged: boolean;
  fraDisclaimerText: string;
  claimedByOfficerId?: string;
  claimedUntil?: string; // ISO String for Valkey SETNX lock
  riskScore: string; // Decimal string representation e.g. "0.0500"
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitKYCDto {
  userId: string;
  nationalIdNumber: string;
  fullNameArabic: string;
  dateOfBirth: string;
  governorate: string;
  gender: 'MALE' | 'FEMALE';
  expiryDate: string;
  fraConsentAcknowledged: boolean;
}

export interface ClaimKYCDto {
  applicationId: string;
  officerId: string;
}

export interface KYCDecisionDto {
  applicationId: string;
  officerId: string;
  decision: 'APPROVED' | 'REJECTED' | 'PENDING_RESUBMISSION';
  reason?: string;
}
