import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './index';
import { theme } from '../../theme';

export type ConfirmOptions = {
  title: string;
  subtitle?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Red destructive styling for the confirm button. Defaults to true — most
   * confirmations in this app (delete, sign out) are destructive/irreversible. */
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
};

type ConfirmState = {
  options: ConfirmOptions;
  pending: boolean;
  error: string | null;
};

const ConfirmContext = createContext<
  ((options: ConfirmOptions) => void) | null
>(null);

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return confirm;
}

export function ConfirmProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ options, pending: false, error: null });
  }, []);

  const close = () => {
    if (stateRef.current?.pending) {
      return;
    }
    setState(null);
  };

  const handleConfirm = async () => {
    if (!stateRef.current) {
      return;
    }
    setState(current =>
      current ? { ...current, pending: true, error: null } : current,
    );
    try {
      await stateRef.current.options.onConfirm();
      setState(null);
    } catch (err) {
      setState(current =>
        current
          ? {
              ...current,
              pending: false,
              error:
                err instanceof Error
                  ? err.message
                  : 'Something went wrong. Please try again.',
            }
          : current,
      );
    }
  };

  const destructive = state?.options.destructive ?? true;
  const iconColor = destructive ? theme.colors.danger : theme.colors.primary;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        visible={!!state}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.root}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={close}
            style={styles.backdrop}
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.heading}>
              <View
                style={[
                  styles.iconBadge,
                  destructive ? styles.iconBadgeDestructive : styles.iconBadgePrimary,
                ]}
              >
                <Ionicons
                  name={
                    state?.options.icon ??
                    (destructive ? 'alert-circle-outline' : 'information-circle-outline')
                  }
                  size={22}
                  color={iconColor}
                />
              </View>
              <View style={styles.headingText}>
                <AppText accessibilityRole="header" style={styles.title}>
                  {state?.options.title}
                </AppText>
                {!!state?.options.subtitle && (
                  <AppText style={styles.subtitle}>
                    {state.options.subtitle}
                  </AppText>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                accessibilityState={{ disabled: state?.pending }}
                disabled={state?.pending}
                onPress={close}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={theme.colors.secondary}
                />
              </Pressable>
            </View>
            <View style={styles.body}>
              {!!state?.options.message && (
                <AppText style={styles.message}>
                  {state.options.message}
                </AppText>
              )}
              {!!state?.error && (
                <AppText accessibilityRole="alert" style={styles.error}>
                  {state.error}
                </AppText>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: state?.pending }}
                disabled={state?.pending}
                onPress={handleConfirm}
                style={[
                  styles.confirmButton,
                  destructive
                    ? styles.confirmButtonDestructive
                    : styles.confirmButtonPrimary,
                  state?.pending && styles.disabled,
                ]}
              >
                {state?.pending && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                <AppText style={styles.confirmButtonText}>
                  {state?.pending
                    ? 'Please wait…'
                    : state?.options.confirmLabel ?? 'Confirm'}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: state?.pending }}
                disabled={state?.pending}
                onPress={close}
                style={styles.cancelButton}
              >
                <AppText style={styles.cancelText}>
                  {state?.options.cancelLabel ?? 'Cancel'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  heading: {
    alignItems: 'center',
    paddingBottom: 16,
    gap: 12,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeDestructive: { backgroundColor: '#FEF2F2' },
  iconBadgePrimary: { backgroundColor: theme.colors.primaryLight },
  headingText: { width: '100%', alignItems: 'center', gap: 3 },
  title: {
    fontFamily: theme.fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  body: { gap: 12, paddingBottom: 4 },
  message: {
    color: theme.colors.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 2,
  },
  error: { color: theme.colors.danger, fontSize: 13, textAlign: 'center' },
  confirmButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  confirmButtonDestructive: { backgroundColor: theme.colors.danger },
  confirmButtonPrimary: { backgroundColor: theme.colors.primary },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  cancelButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  disabled: { opacity: 0.55 },
});
