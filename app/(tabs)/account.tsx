import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Button, Feedback, Loading } from '../../src/components/ui';
import { useConfirm } from '../../src/components/ui/ConfirmDialog';
import { ShopHeader, shop } from '../../src/components/shop';
import { useAddresses } from '../../src/features/address/hooks';
import { useAccount } from '../../src/features/auth/hooks';
import { useWishlist } from '../../src/features/wishlist/hooks';
import { useCompareStore } from '../../src/stores/compare';
import { useSession } from '../../src/stores/session';
import { theme } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function MenuRow({
  icon,
  label,
  onPress,
  count,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  count?: number;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={count ? `${label} (${count})` : label}
      disabled={!onPress}
      onPress={onPress}
      style={styles.menuRow}
    >
      <Ionicons name={icon} size={23} color={theme.colors.primary} />
      <AppText style={styles.menuLabel}>{label}</AppText>
      {!!count && count > 0 && (
        <View style={styles.menuBadge}>
          <AppText style={styles.menuBadgeText}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      )}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={17}
          color={theme.colors.primary}
        />
      )}
    </Pressable>
  );
}

function OrderShortcut({
  icon,
  label,
  view,
}: {
  icon: IconName;
  label: string;
  view: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} orders`}
      onPress={() => router.push({ pathname: '/orders', params: { view } })}
      style={styles.orderShortcut}
    >
      <View style={styles.orderIcon}>
        <Ionicons name={icon} size={27} color={theme.colors.primary} />
      </View>
      <AppText numberOfLines={1} style={styles.orderLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function Account() {
  const status = useSession(s => s.status);
  const signOut = useSession(s => s.signOut);
  const confirm = useConfirm();
  const account = useAccount();
  const addresses = useAddresses();
  const wishlist = useWishlist();
  const wishlistCount = wishlist.data?.pages[0]?.total ?? 0;
  const compareCount = useCompareStore(s => s.items.length);
  const preferred =
    addresses.data?.items.find(item => item.isDefault) ??
    addresses.data?.items[0];
  const location = preferred
    ? [preferred.addressLine1, preferred.city.name, preferred.state.name]
        .filter(Boolean)
        .join(', ')
    : 'Choose delivery address';
  const name =
    [account.data?.firstName, account.data?.lastName]
      .filter(Boolean)
      .join(' ') || 'Your account';
  const initials =
    [account.data?.firstName?.[0], account.data?.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || 'E';

  return (
    <View style={shop.page}>
      <View style={styles.header}>
        <ShopHeader />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage delivery address"
          onPress={() =>
            router.push(status === 'authenticated' ? '/addresses' : '/login')
          }
          style={styles.location}
        >
          <Ionicons
            name="location-outline"
            size={19}
            color={theme.colors.secondary}
          />
          <AppText numberOfLines={1} style={styles.locationText}>
            {location}
          </AppText>
          <Ionicons
            name="chevron-down"
            size={17}
            color={theme.colors.secondary}
          />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {status === 'loading' && <Loading />}
        {status === 'error' && (
          <Feedback
            title="Unable to load your session"
            message="Please try again."
            onRetry={() =>
              useSession
                .getState()
                .initialize()
                .catch(() => undefined)
            }
          />
        )}
        {status === 'guest' && (
          <View style={styles.guest}>
            <View style={styles.guestAvatar}>
              <Ionicons
                name="person-outline"
                size={30}
                color={theme.colors.primary}
              />
            </View>
            <AppText style={styles.guestTitle}>Welcome to Elexify</AppText>
            <AppText style={styles.guestMessage}>
              Sign in to track orders, save addresses and check out faster.
            </AppText>
            <View style={styles.guestButtonWrap}>
              <Button label="Sign in" onPress={() => router.push('/login')} />
            </View>
            <View style={styles.guestBenefits}>
              <View style={styles.guestBenefitItem}>
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <AppText style={styles.guestBenefitLabel}>Track orders</AppText>
              </View>
              <View style={styles.guestBenefitItem}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <AppText style={styles.guestBenefitLabel}>
                  Wishlist & offers
                </AppText>
              </View>
              <View style={styles.guestBenefitItem}>
                <Ionicons
                  name="flash-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <AppText style={styles.guestBenefitLabel}>
                  Faster checkout
                </AppText>
              </View>
            </View>
          </View>
        )}
        {status === 'authenticated' && (
          <>
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <AppText style={styles.initials}>{initials}</AppText>
              </View>
              <View style={styles.profileText}>
                <AppText numberOfLines={1} style={styles.profileName}>
                  {name}
                </AppText>
                {!!account.data?.mobile && (
                  <AppText style={styles.profileDetail}>
                    {account.data.mobile}
                  </AppText>
                )}
                {!!account.data?.email && (
                  <AppText numberOfLines={1} style={styles.profileEmail}>
                    {account.data.email}
                  </AppText>
                )}
              </View>
            </View>
            {account.isPending && <Loading />}
            {account.isError && (
              <Feedback
                title="Unable to load your details"
                message={account.error.message}
                onRetry={() => account.refetch().catch(() => undefined)}
              />
            )}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>My Orders</AppText>
              <View style={styles.orderGrid}>
                <OrderShortcut
                  icon="cube-outline"
                  label="Ongoing"
                  view="ongoing"
                />
                <OrderShortcut
                  icon="car-outline"
                  label="Completed"
                  view="completed"
                />
                <OrderShortcut
                  icon="return-down-back-outline"
                  label="Returns"
                  view="returns"
                />
                <OrderShortcut
                  icon="receipt-outline"
                  label="Cancel"
                  view="cancelled"
                />
              </View>
              <MenuRow
                icon="location-outline"
                label="Manage Address"
                onPress={() => router.push('/addresses')}
              />
              <MenuRow
                icon="heart-outline"
                label="Wishlist"
                count={wishlistCount}
                onPress={() => router.push('/wishlist')}
              />
              <MenuRow
                icon="time-outline"
                label="Recently Viewed"
                onPress={() => router.push('/recently-viewed')}
              />
              <AppText style={[styles.sectionTitle, styles.groupTitle]}>
                Settings
              </AppText>
              <MenuRow
                icon="person-outline"
                label="Profile"
                onPress={() => router.push('/account/profile')}
              />
              <MenuRow
                icon="shield-checkmark-outline"
                label="Security"
                onPress={() => router.push('/account/security')}
              />
              <MenuRow
                icon="notifications-outline"
                label="Notification Preferences"
                onPress={() => router.push('/account/preferences')}
              />
            </View>
          </>
        )}
        {/* Compare doesn't require sign-in, so this row stays reachable for guests too. */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Shop</AppText>
          <MenuRow
            icon="git-compare-outline"
            label="Compare Products"
            count={compareCount}
            onPress={() => router.push('/compare')}
          />
        </View>
        {/* Support/legal links must be reachable without signing in — App Store
            and Play Store review both require a reachable privacy policy. */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Support</AppText>
          <MenuRow
            icon="help-circle-outline"
            label="FAQs"
            onPress={() => router.push('/faq')}
          />
          <MenuRow
            icon="mail-outline"
            label="Contact Us"
            onPress={() => router.push('/contact-us')}
          />
          <AppText style={[styles.sectionTitle, styles.groupTitle]}>
            Legal
          </AppText>
          <MenuRow
            icon="information-circle-outline"
            label="About Us"
            onPress={() =>
              router.push({
                pathname: '/legal/[slug]',
                params: { slug: 'about-us' },
              })
            }
          />
          <MenuRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() =>
              router.push({
                pathname: '/legal/[slug]',
                params: { slug: 'privacy-policy' },
              })
            }
          />
          <MenuRow
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() =>
              router.push({
                pathname: '/legal/[slug]',
                params: { slug: 'terms-conditions' },
              })
            }
          />
          <MenuRow
            icon="return-up-back-outline"
            label="Refund & Cancellation Policy"
            onPress={() =>
              router.push({
                pathname: '/legal/[slug]',
                params: { slug: 'refund-cancellations-policy' },
              })
            }
          />
          {status === 'authenticated' && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                confirm({
                  title: 'Sign out?',
                  message:
                    'You can always sign back in with your mobile number or Google account.',
                  confirmLabel: 'Sign out',
                  cancelLabel: 'Stay signed in',
                  onConfirm: () => signOut(),
                })
              }
              style={styles.signOut}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.colors.danger}
              />
              <AppText style={styles.signOutText}>Sign out</AppText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#EEFFFD' },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  locationText: { flex: 1, color: theme.colors.secondary, fontSize: 13 },
  content: { flexGrow: 1, paddingBottom: 36 },
  guest: {
    paddingHorizontal: 28,
    paddingVertical: 36,
    gap: 16,
    alignItems: 'center',
  },
  guestAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  guestTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    fontSize: 19,
    textAlign: 'center',
  },
  guestMessage: {
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  guestButtonWrap: { alignSelf: 'stretch' },
  guestBenefits: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  guestBenefitItem: { flex: 1, alignItems: 'center', gap: 5 },
  guestBenefitLabel: {
    color: theme.colors.secondary,
    fontSize: 11,
    textAlign: 'center',
  },
  profile: {
    minHeight: 140,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 22,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#D5F3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 30,
  },
  profileText: { flex: 1, gap: 2 },
  profileName: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 20,
  },
  profileDetail: { color: '#FFFFFF', fontSize: 12 },
  profileEmail: { color: '#FFFFFF', fontSize: 12, fontStyle: 'italic' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    marginBottom: 14,
  },
  groupTitle: { marginTop: 16 },
  orderGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  orderShortcut: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0 },
  orderIcon: {
    width: 56,
    height: 56,
    borderRadius: 11,
    backgroundColor: '#EAF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderLabel: { fontSize: 12, color: theme.colors.text, textAlign: 'center' },
  menuRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  menuLabel: { flex: 1, fontFamily: theme.fonts.medium, fontSize: 15 },
  menuBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  signOutText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
});
