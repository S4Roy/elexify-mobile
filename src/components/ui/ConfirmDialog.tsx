import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './index';
import { theme } from '../../theme';

export type ConfirmOptions = {
  title: string;
  subtitle?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
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

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        visible={!!state}
        transparent
        animationType="slide"
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
          <SafeAreaView
            edges={['bottom']}
            style={styles.sheet}
            accessibilityViewIsModal
          >
            <View style={styles.handle} />
            <View style={styles.heading}>
              <View style={styles.headingText}>
                <AppText style={styles.title}>{state?.options.title}</AppText>
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
          </SafeAreaView>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    gap: 10,
  },
  headingText: { flex: 1 },
  title: { fontFamily: theme.fonts.semibold, fontSize: 18 },
  subtitle: { color: theme.colors.secondary, fontSize: 13, marginTop: 2 },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { gap: 14, paddingBottom: 16 },
  message: { color: theme.colors.secondary, fontSize: 14, lineHeight: 20 },
  error: { color: theme.colors.danger, fontSize: 13 },
  confirmButton: {
    minHeight: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDestructive: { backgroundColor: theme.colors.danger },
  confirmButtonPrimary: { backgroundColor: theme.colors.primary },
  confirmButtonText: { color: '#FFFFFF', fontFamily: theme.fonts.semibold },
  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: theme.colors.primary, fontFamily: theme.fonts.medium },
  disabled: { opacity: 0.5 },
});
