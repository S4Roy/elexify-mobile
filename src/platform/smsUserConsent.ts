import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { extractOtpFromSms } from '../utils/otp';

// Android-only bridge to com.elexify.smsconsent.SmsUserConsentModule (Google
// SMS User Consent API). iOS needs nothing: its keyboard offers the code
// "From Messages" for a textContentType="oneTimeCode" field.
type SmsUserConsentNative = {
  startListening(): Promise<boolean>;
  stopListening(): void;
};

const native: SmsUserConsentNative | undefined =
  Platform.OS === 'android' ? NativeModules.SmsUserConsent : undefined;
const emitter = native
  ? new NativeEventEmitter(NativeModules.SmsUserConsent)
  : null;

/**
 * While `enabled`, waits for the next SMS and — once the user taps "Allow" on
 * the system sheet — passes its `length`-digit code to `onCode`. Changing
 * `listenKey` (e.g. after "Resend OTP") starts a fresh listen, since each
 * listen ends after one SMS or Play Services' five-minute timeout.
 */
export function useSmsUserConsent({
  enabled,
  length,
  listenKey,
  onCode,
}: {
  enabled: boolean;
  length: number;
  listenKey?: string | number;
  onCode: (code: string) => void;
}) {
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!enabled || !native || !emitter) {
      return;
    }
    const sub = emitter.addListener(
      'SmsUserConsent:message',
      (event: { message?: string }) => {
        const code = extractOtpFromSms(event?.message ?? '', length);
        if (code) {
          onCodeRef.current(code);
        }
      },
    );
    // Missing Play Services or an unsupported device just means no prompt —
    // manual entry and keyboard suggestions still work.
    native.startListening().catch(() => undefined);
    return () => {
      sub.remove();
      native.stopListening();
    };
  }, [enabled, length, listenKey]);
}
