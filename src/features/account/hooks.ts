import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import {
  changePassword,
  fetchNotificationPreferences,
  requestEmailChange,
  requestMobileChange,
  resendAccountOtp,
  updateNotificationPreferences,
  updateProfile,
  verifyEmailChange,
  verifyMobileChange,
  type NotificationPreferences,
} from '../../api/account';
import { uploadMedia, type PickedImage } from '../../api/media';
import { useSession } from '../../stores/session';
import { useIdentity } from '../catalog/hooks';

function useInvalidateAccount() {
  const queryClient = useQueryClient();
  const identity = useIdentity();
  return () => queryClient.invalidateQueries({ queryKey: ['account', identity] }).catch(() => undefined);
}

export function useRequestEmailChange() {
  return useMutation({ mutationFn: (email: string) => requestEmailChange(email) });
}
export function useVerifyEmailChange() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: (otp: string) => verifyEmailChange(otp),
    onSuccess: invalidate,
  });
}
export function useRequestMobileChange() {
  return useMutation({ mutationFn: (mobile: string) => requestMobileChange(mobile) });
}
export function useVerifyMobileChange() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: (otp: string) => verifyMobileChange(otp),
    onSuccess: invalidate,
  });
}
export function useResendAccountOtp() {
  return useMutation({
    mutationFn: (purpose: 'change_email' | 'change_mobile') => resendAccountOtp(purpose),
  });
}
export function useChangePassword() {
  return useMutation({
    mutationFn: (params: { currentPassword: string; password: string; confirmPassword: string }) =>
      changePassword(params),
  });
}

export function useUpdateProfile() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: (params: {
      firstName?: string;
      lastName?: string;
      dob?: string | null;
      gender?: string | null;
    }) => updateProfile(params),
    onSuccess: invalidate,
  });
}

export function useUpdateAvatar() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: async (image: PickedImage) => {
      const [uploaded] = await uploadMedia([image]);
      if (!uploaded) {
        throw new Error('Upload failed');
      }
      await updateProfile({ profileImage: uploaded.url });
    },
    onSuccess: invalidate,
  });
}

export function useNotificationPreferences() {
  const status = useSession(s => s.status);
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: ({ signal }) => fetchNotificationPreferences(signal),
    enabled: !!apiConfig.baseUrl && status === 'authenticated',
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: NotificationPreferences) => updateNotificationPreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }).catch(() => undefined);
    },
  });
}
