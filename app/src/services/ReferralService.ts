import { evenlyApiClient } from './EvenlyApiClient';

interface ReferralCodeResponse {
  success: boolean;
  data: { referralCode: string };
}

interface ReferralStatsResponse {
  success: boolean;
  data: {
    totalReferrals: number;
    completedReferrals: number;
    referredUsers: {
      id: string;
      name: string;
      email: string;
      joinedAt: string;
    }[];
  };
}

interface ApplyReferralResponse {
  success: boolean;
  message: string;
}

interface ValidateCodeResponse {
  success: boolean;
  data: {
    valid: boolean;
    referrerName?: string;
  };
}

export class ReferralService {
  static async getMyReferralCode(): Promise<ReferralCodeResponse> {
    return evenlyApiClient.get<ReferralCodeResponse>('/referrals/my-code');
  }

  static async getReferralStats(): Promise<ReferralStatsResponse> {
    return evenlyApiClient.get<ReferralStatsResponse>('/referrals/stats');
  }

  static async applyReferralCode(referralCode: string): Promise<ApplyReferralResponse> {
    return evenlyApiClient.post<ApplyReferralResponse>('/referrals/apply', { referralCode });
  }

  static async validateReferralCode(code: string): Promise<ValidateCodeResponse> {
    return evenlyApiClient.get<ValidateCodeResponse>(`/referrals/validate/${code}`);
  }
}
