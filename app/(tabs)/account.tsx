import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppText, Button, Feedback, Loading } from '../../src/components/ui';
import { ShopHeader, shop } from '../../src/components/shop';
import { useAddresses } from '../../src/features/address/hooks';
import { useAccount } from '../../src/features/auth/hooks';
import { useWishlist } from '../../src/features/wishlist/hooks';
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
    <Pressable accessibilityRole={onPress ? 'button' : 'text'} accessibilityLabel={count ? `${label} (${count})` : label} disabled={!onPress} onPress={onPress} style={styles.menuRow}>
      <Ionicons name={icon} size={23} color={theme.colors.primary} />
      <AppText style={styles.menuLabel}>{label}</AppText>
      {!!count && count > 0 && (
        <View style={styles.menuBadge}>
          <AppText style={styles.menuBadgeText}>{count > 99 ? '99+' : count}</AppText>
        </View>
      )}
      {onPress && <Ionicons name="chevron-forward" size={17} color={theme.colors.primary} />}
    </Pressable>
  );
}

function OrderShortcut({ icon, label, view }: { icon: IconName; label: string; view: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} orders`} onPress={() => router.push({ pathname: '/orders', params: { view } })} style={styles.orderShortcut}>
      <View style={styles.orderIcon}><Ionicons name={icon} size={27} color={theme.colors.primary} /></View>
      <AppText numberOfLines={1} style={styles.orderLabel}>{label}</AppText>
    </Pressable>
  );
}

export default function Account() {
  const status = useSession(s => s.status);
  const signOut = useSession(s => s.signOut);
  const account = useAccount();
  const addresses = useAddresses();
  const wishlist = useWishlist();
  const wishlistCount = wishlist.data?.pages[0]?.total ?? 0;
  const preferred = addresses.data?.items.find(item => item.isDefault) ?? addresses.data?.items[0];
  const location = preferred
    ? [preferred.addressLine1, preferred.city.name, preferred.state.name].filter(Boolean).join(', ')
    : 'Choose delivery address';
  const name = [account.data?.firstName, account.data?.lastName].filter(Boolean).join(' ') || 'Your account';
  const initials = [account.data?.firstName?.[0], account.data?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'E';

  return (
    <View style={shop.page}>
      <View style={styles.header}>
        <ShopHeader />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage delivery address"
          onPress={() => router.push(status === 'authenticated' ? '/addresses' : '/login')}
          style={styles.location}
        >
          <Ionicons name="location-outline" size={19} color={theme.colors.secondary} />
          <AppText numberOfLines={1} style={styles.locationText}>{location}</AppText>
          <Ionicons name="chevron-down" size={17} color={theme.colors.secondary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {status === 'loading' && <Loading />}
        {status === 'error' && (
          <Feedback title="Unable to load your session" message="Please try again." onRetry={() => useSession.getState().initialize().catch(() => undefined)} />
        )}
        {status === 'guest' && (
          <View style={styles.guest}>
            <AppText style={styles.sectionTitle}>Welcome to Elexify</AppText>
            <AppText style={styles.guestMessage}>Sign in to track orders and manage your addresses.</AppText>
            <Button label="Sign in" onPress={() => router.push('/login')} />
          </View>
        )}
        {status === 'authenticated' && (
          <>
            <View style={styles.profile}>
              <View style={styles.avatar}><AppText style={styles.initials}>{initials}</AppText></View>
              <View style={styles.profileText}>
                <AppText numberOfLines={1} style={styles.profileName}>{name}</AppText>
                {!!account.data?.mobile && <AppText style={styles.profileDetail}>{account.data.mobile}</AppText>}
                {!!account.data?.email && <AppText numberOfLines={1} style={styles.profileEmail}>{account.data.email}</AppText>}
              </View>
            </View>
            {account.isPending && <Loading />}
            {account.isError && (
              <Feedback title="Unable to load your details" message={account.error.message} onRetry={() => account.refetch().catch(() => undefined)} />
            )}
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>My Orders</AppText>
              <View style={styles.orderGrid}>
                <OrderShortcut icon="cube-outline" label="Ongoing" view="ongoing" />
                <OrderShortcut icon="car-outline" label="Completed" view="completed" />
                <OrderShortcut icon="return-down-back-outline" label="Returns" view="returns" />
                <OrderShortcut icon="receipt-outline" label="Cancel" view="cancelled" />
              </View>
              <MenuRow icon="location-outline" label="Manage Address" onPress={() => router.push('/addresses')} />
              <MenuRow icon="heart-outline" label="Wishlist" count={wishlistCount} onPress={() => router.push('/wishlist')} />
              <MenuRow icon="time-outline" label="Recently Viewed" onPress={() => router.push('/recently-viewed')} />
              <AppText style={[styles.sectionTitle, styles.groupTitle]}>Settings</AppText>
              <MenuRow icon="settings-outline" label="Manage App" />
              <AppText style={[styles.sectionTitle, styles.groupTitle]}>Other</AppText>
              <MenuRow icon="help-circle-outline" label="FAQ’s" />
              <Pressable accessibilityRole="button" onPress={() => signOut().catch(() => undefined)} style={styles.signOut}>
                <AppText style={styles.signOutText}>Sign out</AppText>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#EEFFFD' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  locationText: { flex: 1, color: theme.colors.secondary, fontSize: 13 },
  content: { flexGrow: 1, paddingBottom: 36 },
  guest: { padding: 22, gap: 18 },
  guestMessage: { color: theme.colors.secondary },
  profile: { minHeight: 140, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 22 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#D5F3EE', alignItems: 'center', justifyContent: 'center' },
  initials: { color: theme.colors.primary, fontFamily: theme.fonts.semibold, fontSize: 30 },
  profileText: { flex: 1, gap: 2 },
  profileName: { color: '#FFFFFF', fontFamily: theme.fonts.semibold, fontSize: 20 },
  profileDetail: { color: '#FFFFFF', fontSize: 12 },
  profileEmail: { color: '#FFFFFF', fontSize: 12, fontStyle: 'italic' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: 16, marginBottom: 14 },
  groupTitle: { marginTop: 16 },
  orderGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  orderShortcut: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0 },
  orderIcon: { width: 56, height: 56, borderRadius: 11, backgroundColor: '#EAF5F5', alignItems: 'center', justifyContent: 'center' },
  orderLabel: { fontSize: 12, color: theme.colors.text, textAlign: 'center' },
  menuRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
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
  signOut: { alignSelf: 'flex-start', paddingVertical: 20, paddingHorizontal: 8 },
  signOutText: { color: theme.colors.primary, fontFamily: theme.fonts.medium, fontSize: 14 },
});
