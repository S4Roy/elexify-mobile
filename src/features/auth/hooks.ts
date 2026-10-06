import { useMutation, useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { apiConfig, googleConfig } from '../../api/config';
import { ApiError } from '../../api/client';
import {
  fetchAccount,
  fetchGoogleSignInPlatforms,
  googleLogin,
  sendOtp,
  verifyOtp,
} from '../../api/auth';
import { useSession } from '../../stores/session';
import { useIdentity } from '../catalog/hooks';

let googleConfigured = false;
function ensureGoogleConfigured() {
  if (googleConfigured) {
    return;
  }
  googleConfigured = true;
  GoogleSignin.configure({
    webClientId: googleConfig.webClientId,
    ...(googleConfig.iosClientId
      ? { iosClientId: googleConfig.iosClientId }
      : {}),
  });
}

export function useSendOtp() {
  return useMutation({ mutationFn: (mobile: string) => sendOtp(mobile) });
}
export function useVerifyOtp() {
  const signIn = useSession(s => s.signIn);
  return useMutation({
    mutationFn: (params: {
      mobile: string;
      otp: string;
      firstName?: string;
      lastName?: string;
    }) => verifyOtp(params),
    onSuccess: result => signIn(result.token),
  });
}
/** Whether to offer "Continue with Google" on this device. iOS also needs
 * its OAuth client compiled into the build (reversed client ID URL scheme),
 * so it stays hidden until EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set. If the
 * admin setting can't be loaded the button keeps showing, as before. */
export function useGoogleSignInAvailable() {
  const query = useQuery({
    queryKey: ['google-signin-platforms'],
    queryFn: ({ signal }) => fetchGoogleSignInPlatforms(signal),
    enabled: !!apiConfig.baseUrl && !!googleConfig.webClientId,
    staleTime: 5 * 60 * 1000,
  });
  if (!googleConfig.webClientId) return false;
  if (Platform.OS === 'ios' && !googleConfig.iosClientId) return false;
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return query.data ? query.data[platform] : true;
}
export function useGoogleSignIn() {
  const signIn = useSession(s => s.signIn);
  return useMutation({
    mutationFn: async () => {
      if (!googleConfig.webClientId) {
        throw new ApiError('Google Sign-In is not configured for this app.');
      }
      ensureGoogleConfigured();
      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        const response = await GoogleSignin.signIn();
        if (!isSuccessResponse(response)) {
          return null;
        }
        const idToken = response.data.idToken;
        if (!idToken) {
          throw new ApiError('Google did not return a valid credential.');
        }
        const result = await googleLogin(idToken);
        await signIn(result.token);
        return result;
      } catch (error) {
        if (isErrorWithCode(error)) {
          if (
            error.code === statusCodes.SIGN_IN_CANCELLED ||
            error.code === statusCodes.IN_PROGRESS
          ) {
            return null;
          }
          if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new ApiError(
              'Google Play Services is unavailable on this device.',
            );
          }
        }
        if (error instanceof ApiError) {
          throw error;
        }
        // Anything else here is a native SDK/config error (e.g. an
        // unregistered OAuth client) — never surface that raw text to users.
        if (__DEV__) {
          console.warn('Google Sign-In failed', error);
        }
        // The SDK code (e.g. 10 = DEVELOPER_ERROR: app signature not
        // registered for the OAuth client) lets support diagnose it from a
        // screenshot without exposing raw SDK text.
        const code = isErrorWithCode(error) ? ` (code ${error.code})` : '';
        throw new ApiError(
          `Google Sign-In isn't available right now${code}. Please continue with your mobile number.`,
        );
      }
    },
  });
}
export function useAccount() {
  const identity = useIdentity();
  const status = useSession(s => s.status);
  return useQuery({
    queryKey: ['account', identity],
    queryFn: ({ signal }) => fetchAccount(signal),
    enabled: !!apiConfig.baseUrl && status === 'authenticated',
  });
}
