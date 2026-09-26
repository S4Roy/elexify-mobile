import { DevicesCard } from './DevicesCard';
import { useSession } from '../../stores/session';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Feedback, OtpInput } from '../../components/ui';
import { ShopHeader, SkeletonBlock, shop } from '../../components/shop';
import { QueryState } from '../catalog/QueryState';
import { theme } from '../../theme';
import { useAccount } from '../auth/hooks';
import {
  useChangePassword,
  useRequestEmailChange,
  useRequestMobileChange,
  useResendAccountOtp,
  useVerifyEmailChange,
  useVerifyMobileChange,
} from './hooks';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobilePattern = /^[6-9]\d{9}$/;
const otpPattern = /^\d{6}$/;
// Mirrors the backend rule (validations/user/account/edit.js).
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 50;
const RESEND_SECONDS = 60;

const GREEN = '#15803D';
const AMBER = '#B45309';

function StatusBadge({
  verified,
  pending,
}: {
  verified: boolean;
  pending?: boolean;
}) {
  const config = pending
    ? { icon: 'time' as IconName, text: 'Pending', color: AMBER, bg: '#FEF3C7' }
    : verified
    ? {
        icon: 'checkmark-circle' as IconName,
        text: 'Verified',
        color: GREEN,
        bg: '#DCFCE7',
      }
    : {
        icon: 'alert-circle' as IconName,
        text: 'Not verified',
        color: theme.colors.danger,
        bg: '#FEE2E2',
      };
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <AppText style={[styles.badgeText, { color: config.color }]}>
        {config.text}
      </AppText>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        disabled && styles.primaryDisabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        !!icon && <Ionicons name={icon} size={17} color="#FFFFFF" />
      )}
      <AppText style={styles.primaryText}>{label}</AppText>
    </Pressable>
  );
}

function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
    >
      <AppText style={styles.ghostText}>{label}</AppText>
    </Pressable>
  );
}

function InlineMessage({
  tone,
  text,
}: {
  tone: 'error' | 'success';
  text: string;
}) {
  const error = tone === 'error';
  return (
    <View
      accessibilityRole="alert"
      style={[styles.message, error ? styles.messageError : styles.messageOk]}
    >
      <Ionicons
        name={error ? 'alert-circle' : 'checkmark-circle'}
        size={17}
        color={error ? theme.colors.danger : GREEN}
      />
      <AppText
        style={[
          styles.messageText,
          { color: error ? theme.colors.danger : GREEN },
        ]}
      >
        {text}
      </AppText>
    </View>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.sectionHead}>
      <AppText accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </AppText>
      {!!hint && <AppText style={styles.sectionHint}>{hint}</AppText>}
    </View>
  );
}

const maskMobile = (mobile: string) =>
  mobile.length === 10 ? `${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile;

function ChangeContactCard({
  channel,
  current,
  verified,
  pending,
}: {
  channel: 'email' | 'mobile';
  current: string | null;
  verified: boolean;
  pending: string | null;
}) {
  const [step, setStep] = useState<'idle' | 'enter' | 'otp'>('idle');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  // Bumped on every send/resend so the SMS listener restarts.
  const [otpRequest, setOtpRequest] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const requestEmail = useRequestEmailChange();
  const requestMobile = useRequestMobileChange();
  const verifyEmail = useVerifyEmailChange();
  const verifyMobile = useVerifyMobileChange();
  const resend = useResendAccountOtp();

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isEmail = channel === 'email';
  const label = isEmail ? 'Email address' : 'Mobile number';
  const noun = isEmail ? 'email' : 'mobile number';
  const pattern = isEmail ? emailPattern : mobilePattern;
  const requesting = isEmail ? requestEmail : requestMobile;
  const verifying = isEmail ? verifyEmail : verifyMobile;
  const trimmed = value.trim();
  const valid = pattern.test(trimmed);
  const sameAsCurrent =
    !!current &&
    (isEmail
      ? trimmed.toLowerCase() === current.toLowerCase()
      : trimmed.length === 10 && current.replace(/\D/g, '').endsWith(trimmed));
  const target = isEmail ? trimmed : `+91 ${maskMobile(trimmed)}`;

  const startFlow = () => {
    setStep('enter');
    setValue('');
    setError('');
    setDone('');
  };
  const cancel = () => {
    setStep('idle');
    setError('');
  };
  const sendOtp = () => {
    if (!valid || sameAsCurrent || requesting.isPending) {
      return;
    }
    setError('');
    const mutate = isEmail ? requestEmail.mutate : requestMobile.mutate;
    mutate(trimmed, {
      onSuccess: () => {
        setOtp('');
        setStep('otp');
        setCooldown(RESEND_SECONDS);
        setOtpRequest(n => n + 1);
      },
      onError: err => setError(err.message),
    });
  };
  const submitOtp = (code = otp) => {
    if (verifying.isPending || !otpPattern.test(code)) {
      return;
    }
    setError('');
    verifying.mutate(code, {
      onSuccess: () => {
        setStep('idle');
        setDone(
          `Your ${noun} has been updated to ${
            isEmail ? trimmed : `+91 ${maskMobile(trimmed)}`
          }.`,
        );
      },
      onError: err => {
        setOtp('');
        setError(err.message);
      },
    });
  };
  const onResend = () => {
    if (cooldown > 0 || resend.isPending) {
      return;
    }
    setError('');
    resend.mutate(isEmail ? 'change_email' : 'change_mobile', {
      onSuccess: () => {
        setOtp('');
        setCooldown(RESEND_SECONDS);
        setOtpRequest(n => n + 1);
      },
      onError: err => setError(err.message),
    });
  };

  return (
    <View style={styles.contact}>
      <View style={styles.rowHead}>
        <View style={styles.rowIcon}>
          <Ionicons
            name={isEmail ? 'mail-outline' : 'phone-portrait-outline'}
            size={18}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.rowLabel}>{label}</AppText>
          {current ? (
            <AppText style={styles.rowValue} numberOfLines={1}>
              {current}
            </AppText>
          ) : (
            <AppText style={styles.rowEmpty}>Not added</AppText>
          )}
          {!!current && (
            <View style={styles.badgeRow}>
              <StatusBadge verified={verified} pending={!!pending} />
            </View>
          )}
        </View>
        {step === 'idle' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${current ? 'Change' : 'Add'} ${noun}`}
            onPress={startFlow}
            hitSlop={6}
            style={({ pressed }) => [
              styles.changeBtn,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.changeText}>
              {current ? 'Change' : 'Add'}
            </AppText>
          </Pressable>
        )}
      </View>

      {!!pending && step === 'idle' && (
        <View style={styles.pendingNote}>
          <Ionicons name="time-outline" size={14} color={AMBER} />
          <AppText style={styles.pendingText}>
            Change to {pending} is waiting for verification. Tap Change to send
            a new code.
          </AppText>
        </View>
      )}
      {!!done && step === 'idle' && (
        <InlineMessage tone="success" text={done} />
      )}

      {step !== 'idle' && (
        <View style={styles.flow}>
          <View style={styles.steps} accessibilityElementsHidden>
            <View style={[styles.stepDot, styles.stepDotOn]}>
              {step === 'otp' ? (
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              ) : (
                <AppText style={styles.stepNum}>1</AppText>
              )}
            </View>
            <AppText style={[styles.stepLabel, styles.stepLabelOn]}>
              New {noun}
            </AppText>
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 'otp' && styles.stepDotOn]}>
              <AppText
                style={[styles.stepNum, step !== 'otp' && styles.stepNumOff]}
              >
                2
              </AppText>
            </View>
            <AppText
              style={[styles.stepLabel, step === 'otp' && styles.stepLabelOn]}
            >
              Verify
            </AppText>
          </View>

          {step === 'enter' && (
            <>
              <View
                style={[
                  styles.inputShell,
                  !!trimmed && (!valid || sameAsCurrent) && styles.inputWarn,
                ]}
              >
                {isEmail ? (
                  <Ionicons
                    name="at-outline"
                    size={18}
                    color={theme.colors.secondary}
                  />
                ) : (
                  <AppText style={styles.prefix}>+91</AppText>
                )}
                <TextInput
                  accessibilityLabel={`New ${noun}`}
                  value={value}
                  onChangeText={
                    isEmail ? setValue : v => setValue(v.replace(/\D/g, ''))
                  }
                  placeholder={
                    isEmail ? 'name@example.com' : '10-digit mobile number'
                  }
                  placeholderTextColor="#9CA3AF"
                  keyboardType={isEmail ? 'email-address' : 'number-pad'}
                  autoComplete={isEmail ? 'email' : 'tel-national'}
                  textContentType={isEmail ? 'emailAddress' : 'telephoneNumber'}
                  maxLength={isEmail ? 120 : 10}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={sendOtp}
                  style={styles.inputText}
                />
              </View>
              <AppText style={styles.helper}>
                {sameAsCurrent
                  ? `This is already your ${noun}.`
                  : !!trimmed && !valid
                  ? isEmail
                    ? 'Enter a valid email address.'
                    : 'Enter a valid 10-digit Indian mobile number.'
                  : `We'll send a 6-digit code to confirm it's yours.`}
              </AppText>
              {!!error && <InlineMessage tone="error" text={error} />}
              <View style={styles.actions}>
                <GhostButton label="Cancel" onPress={cancel} />
                <PrimaryButton
                  label={requesting.isPending ? 'Sending…' : 'Send code'}
                  icon="paper-plane-outline"
                  busy={requesting.isPending}
                  disabled={!valid || sameAsCurrent || requesting.isPending}
                  onPress={sendOtp}
                />
              </View>
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.sentTo}>
                <AppText style={styles.sentText}>
                  Enter the code sent to{' '}
                  <AppText style={styles.sentTarget}>{target}</AppText>
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${noun}`}
                  onPress={() => {
                    setError('');
                    setStep('enter');
                  }}
                  hitSlop={8}
                >
                  <AppText style={styles.link}>Edit</AppText>
                </Pressable>
              </View>
              <OtpInput
                value={otp}
                onChange={setOtp}
                autoFocus
                smsConsent={!isEmail}
                listenKey={otpRequest}
                onComplete={submitOtp}
              />
              {!!error && <InlineMessage tone="error" text={error} />}
              <PrimaryButton
                label={verifying.isPending ? 'Verifying…' : 'Verify & update'}
                icon="shield-checkmark-outline"
                busy={verifying.isPending}
                disabled={!otpPattern.test(otp) || verifying.isPending}
                onPress={() => submitOtp()}
              />
              <View style={styles.resendRow}>
                <AppText style={styles.helper}>Didn't get it?</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: cooldown > 0 }}
                  disabled={cooldown > 0 || resend.isPending}
                  onPress={onResend}
                  hitSlop={8}
                >
                  <AppText
                    style={[styles.link, cooldown > 0 && styles.linkDisabled]}
                  >
                    {resend.isPending
                      ? 'Sending…'
                      : cooldown > 0
                      ? `Resend in 0:${String(cooldown).padStart(2, '0')}`
                      : 'Resend code'}
                  </AppText>
                </Pressable>
              </View>
              <GhostButton label="Cancel" onPress={cancel} />
            </>
          )}
        </View>
      )}
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  inputRef,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.Ref<TextInput>;
} & Pick<
  TextInputProps,
  'autoComplete' | 'textContentType' | 'returnKeyType' | 'onSubmitEditing'
>) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={[styles.inputShell, focused && styles.inputFocused]}>
        <Ionicons
          name="lock-closed-outline"
          size={17}
          color={theme.colors.secondary}
        />
        <TextInput
          {...props}
          ref={inputRef}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={PASSWORD_MAX}
          placeholder={label}
          placeholderTextColor="#9CA3AF"
          style={styles.inputText}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible(v => !v)}
          hitSlop={10}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={19}
            color={theme.colors.secondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

/** Rough strength guide — the server only enforces the length range. */
function passwordStrength(password: string) {
  if (!password) {
    return { score: 0, label: '', color: '#E5E7EB' };
  }
  let score = 0;
  if (password.length >= PASSWORD_MIN) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length < PASSWORD_MIN) {
    return { score: 1, label: 'Too short', color: theme.colors.danger };
  }
  if (score <= 2) return { score: 2, label: 'Weak', color: '#EA580C' };
  if (score === 3) return { score: 3, label: 'Fair', color: '#D97706' };
  if (score === 4) return { score: 4, label: 'Good', color: '#65A30D' };
  return { score: 5, label: 'Strong', color: GREEN };
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View
      style={styles.rule}
      accessible
      accessibilityLabel={`${text}${ok ? ', done' : ''}`}
    >
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={ok ? GREEN : '#9CA3AF'}
      />
      <AppText style={[styles.ruleText, ok && styles.ruleTextOk]}>
        {text}
      </AppText>
    </View>
  );
}

function PasswordCard() {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const changePassword = useChangePassword();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const longEnough = password.length >= PASSWORD_MIN;
  const matches = password.length > 0 && password === confirmPassword;
  const different = password.length > 0 && password !== currentPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    longEnough &&
    matches &&
    different &&
    !changePassword.isPending;
  const strength = passwordStrength(password);

  const close = () => {
    setShowForm(false);
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const submit = () => {
    if (!canSubmit) {
      return;
    }
    setError('');
    changePassword.mutate(
      { currentPassword, password, confirmPassword },
      {
        onSuccess: () => {
          close();
          setSuccess(true);
          void useSession.getState().signOut(true);
        },
        onError: err => setError(err.message),
      },
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowHead}>
        <View style={styles.rowIcon}>
          <Ionicons name="key-outline" size={18} color={theme.colors.primary} />
        </View>
        <View style={styles.flex}>
          <AppText style={styles.rowLabel}>Password</AppText>
          <AppText style={styles.rowValue}>••••••••••</AppText>
        </View>
        {!showForm && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change password"
            onPress={() => {
              setSuccess(false);
              setShowForm(true);
            }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.changeBtn,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.changeText}>Change</AppText>
          </Pressable>
        )}
      </View>
      {success && !showForm && (
        <InlineMessage
          tone="success"
          text="Password changed. Use your new password next time you sign in."
        />
      )}
      {showForm && (
        <View style={styles.flow}>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="next"
            onSubmitEditing={() => newRef.current?.focus()}
          />
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            inputRef={newRef}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          {!!password && (
            <View
              style={styles.strength}
              accessible
              accessibilityLabel={`Password strength: ${strength.label}`}
            >
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      i <= strength.score && {
                        backgroundColor: strength.color,
                      },
                    ]}
                  />
                ))}
              </View>
              <AppText
                style={[styles.strengthLabel, { color: strength.color }]}
              >
                {strength.label}
              </AppText>
            </View>
          )}
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            inputRef={confirmRef}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <View style={styles.rules}>
            <Rule
              ok={longEnough}
              text={`At least ${PASSWORD_MIN} characters`}
            />
            <Rule ok={matches} text="Both new passwords match" />
            <Rule
              ok={different && currentPassword.length > 0}
              text="Different from your current password"
            />
          </View>
          {!!error && <InlineMessage tone="error" text={error} />}
          <View style={styles.actions}>
            <GhostButton label="Cancel" onPress={close} />
            <PrimaryButton
              label={changePassword.isPending ? 'Updating…' : 'Update password'}
              busy={changePassword.isPending}
              disabled={!canSubmit}
              onPress={submit}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function SecuritySkeleton() {
  return (
    <View style={styles.stack} accessibilityLabel="Loading security settings">
      <SkeletonBlock style={styles.skeletonHero} />
      <SkeletonBlock style={styles.skeletonTitle} />
      <View style={styles.card}>
        {[0, 1].map(i => (
          <View key={i} style={styles.rowHead}>
            <SkeletonBlock style={styles.skeletonIcon} />
            <View style={[styles.flex, styles.skeletonLines]}>
              <SkeletonBlock style={styles.skeletonShort} />
              <SkeletonBlock style={styles.skeletonLong} />
            </View>
          </View>
        ))}
      </View>
      <SkeletonBlock style={styles.skeletonTitle} />
      <SkeletonBlock style={styles.skeletonCard} />
    </View>
  );
}

export default function SecurityScreen() {
  const account = useAccount();
  const data = account.data;

  const checks = data
    ? [
        { ok: !!data.mobile && data.mobileVerified, text: 'Mobile verified' },
        { ok: !!data.email && data.emailVerified, text: 'Email verified' },
      ]
    : [];
  const secure = checks.length > 0 && checks.every(c => c.ok);

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader title="Login & security" back />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DevicesCard />
          <QueryState
            pending={account.isPending}
            error={account.error}
            paused={account.fetchStatus === 'paused'}
            retry={() => {
              account.refetch().catch(() => undefined);
            }}
            skeleton={<SecuritySkeleton />}
          />
          {!account.isPending && !account.isError && !data && (
            <Feedback
              title="Unable to load your details"
              message="Please try again."
            />
          )}
          {data && (
            <>
              <View
                style={[styles.hero, !secure && styles.heroWarn]}
                accessible
                accessibilityLabel={`${
                  secure
                    ? 'Your account is well protected'
                    : 'Finish securing your account'
                }. ${checks
                  .map(c => `${c.text}: ${c.ok ? 'yes' : 'no'}`)
                  .join(', ')}`}
              >
                <View style={[styles.heroIcon, !secure && styles.heroIconWarn]}>
                  <Ionicons
                    name={secure ? 'shield-checkmark' : 'shield-half-outline'}
                    size={26}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.flex}>
                  <AppText style={styles.heroTitle}>
                    {secure
                      ? 'Your account is well protected'
                      : 'Finish securing your account'}
                  </AppText>
                  <AppText style={styles.heroText}>
                    {secure
                      ? 'Your sign-in details are verified.'
                      : 'Verify your mobile number and email to keep your account secure.'}
                  </AppText>
                  <View style={styles.checks}>
                    {checks.map(check => (
                      <View
                        key={check.text}
                        style={[styles.check, !check.ok && styles.checkOff]}
                      >
                        <Ionicons
                          name={check.ok ? 'checkmark-circle' : 'alert-circle'}
                          size={13}
                          color={check.ok ? GREEN : AMBER}
                        />
                        <AppText
                          style={[
                            styles.checkText,
                            { color: check.ok ? GREEN : AMBER },
                          ]}
                        >
                          {check.text}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <SectionTitle
                title="Sign-in details"
                hint="Used to sign in and for order updates"
              />
              <View style={styles.card}>
                <ChangeContactCard
                  channel="mobile"
                  current={
                    data.mobile
                      ? `+${data.phoneCode} ${maskMobile(data.mobile)}`
                      : null
                  }
                  verified={data.mobileVerified}
                  pending={data.pendingMobile}
                />
                <View style={styles.divider} />
                <ChangeContactCard
                  channel="email"
                  current={data.email}
                  verified={data.emailVerified}
                  pending={data.pendingEmail}
                />
              </View>

              <SectionTitle title="Password" />
              <PasswordCard />

              <View style={styles.tip}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <AppText style={styles.tipText}>
                  Never share your OTP or password with anyone.
                </AppText>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  page: { backgroundColor: '#F4F6F8' },
  pressed: { opacity: 0.8 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  stack: { gap: 12 },

  // Hero
  hero: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  heroWarn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
  },
  heroIconWarn: { backgroundColor: '#D97706' },
  heroTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
    marginTop: 2,
  },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  checkOff: { backgroundColor: '#FFFFFF' },
  checkText: { fontFamily: theme.fonts.medium, fontSize: 11, lineHeight: 15 },

  // Sections & cards
  sectionHead: { marginTop: 8, paddingHorizontal: 4 },
  sectionTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
    color: theme.colors.text,
  },
  sectionHint: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
  },
  card: {
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 52,
  },
  contact: { gap: 12 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F3',
  },
  rowLabel: { fontSize: 12, lineHeight: 16, color: theme.colors.secondary },
  rowValue: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
  },
  rowEmpty: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontFamily: theme.fonts.medium, fontSize: 10, lineHeight: 14 },
  changeBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#B2DFDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
  },
  pendingText: { flex: 1, fontSize: 12, lineHeight: 17, color: AMBER },

  // Inline flows
  flow: {
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  stepDotOn: { backgroundColor: theme.colors.primary },
  stepNum: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
  stepNumOff: { color: theme.colors.secondary },
  stepLabel: { fontSize: 12, color: theme.colors.secondary },
  stepLabelOn: { color: theme.colors.text, fontFamily: theme.fonts.medium },
  stepLine: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 4,
    backgroundColor: '#D1D5DB',
  },
  field: { gap: 6 },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.text,
  },
  inputShell: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  inputFocused: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  inputWarn: { borderColor: '#F59E0B' },
  inputText: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 10,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    color: theme.colors.text,
  },
  prefix: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: theme.colors.text,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  helper: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  actions: { flexDirection: 'row', gap: 10 },
  primary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
  },
  primaryDisabled: { backgroundColor: '#9CA3AF' },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  ghost: {
    minHeight: 48,
    minWidth: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  ghostText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 15,
  },
  sentTo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
  },
  sentTarget: { fontFamily: theme.fonts.semibold, color: theme.colors.text },
  link: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
  linkDisabled: { color: '#9CA3AF', fontVariant: ['tabular-nums'] },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  messageError: { backgroundColor: '#FEF2F2' },
  messageOk: { backgroundColor: '#F0FDF4' },
  messageText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Password
  strength: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  strengthLabel: {
    minWidth: 64,
    textAlign: 'right',
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
  },
  rules: { gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText: { fontSize: 12, lineHeight: 17, color: theme.colors.secondary },
  ruleTextOk: { color: GREEN },

  // Tip
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5F3',
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#134E4A' },

  // Skeleton
  skeletonHero: { height: 104, borderRadius: 16 },
  skeletonTitle: { height: 15, width: 120, marginTop: 8 },
  skeletonIcon: { width: 40, height: 40, borderRadius: 20 },
  skeletonLines: { gap: 6 },
  skeletonShort: { height: 11, width: '35%' },
  skeletonLong: { height: 15, width: '70%' },
  skeletonCard: { height: 72, borderRadius: 16 },
});
