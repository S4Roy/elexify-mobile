import { api } from './client';
import { record } from './discovery';

export async function requestEmailChange(email: string): Promise<void> {
  await api.post('user/account/email/request-change', { email });
}
export async function verifyEmailChange(otp: string): Promise<void> {
  await api.post('user/account/email/verify', { otp });
}
export async function requestMobileChange(mobile: string): Promise<void> {
  await api.post('user/account/mobile/request-change', { phone_code: '91', mobile });
}
export async function verifyMobileChange(otp: string): Promise<void> {
  await api.post('user/account/mobile/verify', { otp });
}
export async function resendAccountOtp(purpose: 'change_email' | 'change_mobile'): Promise<void> {
  await api.post('user/account/otp/resend', { purpose });
}

export async function updateProfile(params: {
  firstName?: string;
  lastName?: string;
  dob?: string | null;
  gender?: string | null;
  profileImage?: string;
}): Promise<void> {
  await api.put('user/account/edit', {
    ...(params.firstName !== undefined ? { first_name: params.firstName } : {}),
    ...(params.lastName !== undefined ? { last_name: params.lastName } : {}),
    ...(params.dob !== undefined ? { dob: params.dob } : {}),
    ...(params.gender !== undefined ? { gender: params.gender } : {}),
    ...(params.profileImage !== undefined ? { profile_image: params.profileImage } : {}),
  });
}

export async function changePassword(params: {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  await api.put('user/account/edit', {
    current_password: params.currentPassword,
    password: params.password,
    confirm_password: params.confirmPassword,
  });
}

export type NotificationPreferences = {
  transactional: {
    order_email: boolean;
    order_sms: boolean;
    order_whatsapp: boolean;
    payment_email: boolean;
    payment_sms: boolean;
    refund_email: boolean;
    refund_sms: boolean;
  };
  security: { email: boolean; sms: boolean };
  marketing: { email: boolean; sms: boolean; whatsapp: boolean };
  reminders: {
    abandoned_cart_email: boolean;
    abandoned_cart_whatsapp: boolean;
    wishlist_email: boolean;
  };
};

export type NotificationPreferencesState = {
  preferences: NotificationPreferences;
  emailVerified: boolean;
  mobileVerified: boolean;
  lockedPaths: string[];
};

const boolGroup = <K extends string>(value: unknown, keys: K[]): Record<K, boolean> => {
  const g = record(value);
  return keys.reduce((acc, key) => {
    acc[key] = g[key] === true;
    return acc;
  }, {} as Record<K, boolean>);
};

export async function fetchNotificationPreferences(
  signal?: AbortSignal,
): Promise<NotificationPreferencesState> {
  const res = await api.get('user/account/notification-preferences', { signal });
  const d = record(res.data?.data);
  const p = record(d.preferences);
  return {
    preferences: {
      transactional: boolGroup(p.transactional, [
        'order_email',
        'order_sms',
        'order_whatsapp',
        'payment_email',
        'payment_sms',
        'refund_email',
        'refund_sms',
      ]),
      security: boolGroup(p.security, ['email', 'sms']),
      marketing: boolGroup(p.marketing, ['email', 'sms', 'whatsapp']),
      reminders: boolGroup(p.reminders, [
        'abandoned_cart_email',
        'abandoned_cart_whatsapp',
        'wishlist_email',
      ]),
    },
    emailVerified: d.email_verified === true,
    mobileVerified: d.mobile_verified === true,
    lockedPaths: Array.isArray(d.mandatory_locked_paths)
      ? d.mandatory_locked_paths.filter((path): path is string => typeof path === 'string')
      : [],
  };
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const res = await api.patch('user/account/notification-preferences', preferences);
  const saved = record(record(res.data?.data).preferences);
  return {
    transactional: boolGroup(saved.transactional, [
      'order_email',
      'order_sms',
      'order_whatsapp',
      'payment_email',
      'payment_sms',
      'refund_email',
      'refund_sms',
    ]),
    security: boolGroup(saved.security, ['email', 'sms']),
    marketing: boolGroup(saved.marketing, ['email', 'sms', 'whatsapp']),
    reminders: boolGroup(saved.reminders, [
      'abandoned_cart_email',
      'abandoned_cart_whatsapp',
      'wishlist_email',
    ]),
  };
}
