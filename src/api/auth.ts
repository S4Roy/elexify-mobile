import { api, ApiError } from './client';
import { record, string } from './discovery';

export type SendOtpResult = { isExistingUser: boolean };
export async function sendOtp(mobile: string): Promise<SendOtpResult> {
  const res = await api.post('auth/user/send-otp', {
    mobile,
    phone_code: '91',
    purpose: 'auth',
  });
  const data = record(res.data?.data);
  return { isExistingUser: data.is_existing_user === true };
}

export type VerifyOtpResult = {
  token: string;
  tokenExpirySeconds: number;
  isNewUser: boolean;
  name: string;
};
export async function verifyOtp(params: {
  mobile: string;
  otp: string;
  firstName?: string;
  lastName?: string;
}): Promise<VerifyOtpResult> {
  const res = await api.post('auth/user/verify-otp', {
    mobile: params.mobile,
    phone_code: '91',
    otp: params.otp,
    purpose: 'auth',
    ...(params.firstName ? { first_name: params.firstName } : {}),
    ...(params.lastName ? { last_name: params.lastName } : {}),
  });
  const data = record(res.data?.data);
  const token = record(data.token);
  const accessToken = string(token.access_token);
  if (!accessToken) {
    throw new ApiError('Sign-in did not complete. Please try again.');
  }
  return {
    token: accessToken,
    tokenExpirySeconds:
      typeof token.access_token_expiry === 'number' ? token.access_token_expiry : 3600,
    isNewUser: data.is_new_user === true,
    name: string(record(data.user).name),
  };
}

export type GoogleLoginResult = {
  token: string;
  tokenExpirySeconds: number;
  isNewUser: boolean;
};
export async function googleLogin(idToken: string): Promise<GoogleLoginResult> {
  const res = await api.post('auth/user/google', { id_token: idToken });
  const data = record(res.data?.data);
  const token = record(data.token);
  const accessToken = string(token.access_token);
  if (!accessToken) {
    throw new ApiError('Sign-in did not complete. Please try again.');
  }
  return {
    token: accessToken,
    tokenExpirySeconds:
      typeof token.access_token_expiry === 'number' ? token.access_token_expiry : 3600,
    isNewUser: data.is_new_user === true,
  };
}

export type Account = {
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string | null;
  phoneCode: string;
  dob: string | null;
  gender: string | null;
  profileImage: string | null;
  emailVerified: boolean;
  mobileVerified: boolean;
  pendingEmail: string | null;
  pendingMobile: string | null;
};
export async function fetchAccount(signal?: AbortSignal): Promise<Account> {
  const res = await api.get('user/account/details', { signal });
  const d = record(res.data?.data);
  return {
    firstName: string(d.first_name),
    lastName: string(d.last_name),
    email: string(d.email) || null,
    mobile: string(d.mobile) || null,
    phoneCode: string(d.phone_code) || '91',
    dob: string(d.dob) || null,
    gender: string(d.gender) || null,
    profileImage: string(d.profile_image) || null,
    emailVerified: d.email_verified === true,
    mobileVerified: d.mobile_verified === true,
    pendingEmail: string(d.pending_email) || null,
    pendingMobile: string(d.pending_mobile) || null,
  };
}
