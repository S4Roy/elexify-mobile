import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { AppText, Feedback, Loading } from '../../components/ui';
import { useConfirm } from '../../components/ui/ConfirmDialog';
import { ShopHeader, SkeletonBlock, money, shop } from '../../components/shop';
import { useAddresses } from '../address/hooks';
import { useAccount } from '../auth/hooks';
import { useWishlist } from '../wishlist/hooks';
import { useOrders } from '../orders/hooks';
import { orderStatusColor, orderStatusLabel } from '../orders/tracking';
import { useCompareStore } from '../../stores/compare';
import { useSession } from '../../stores/session';
import { theme } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const PAGE_BG = '#F4F6F8';
const MUTED = '#6B7280';
const FAINT = '#9CA3AF';
const TILE_BG = '#E8F5F3';

const legal = (slug: string): Href => ({
  pathname: '/legal/[slug]',
  params: { slug },
});

/** Rounded white card holding one group of rows, with an optional heading. */
function Group({
  title,
  children,
}: React.PropsWithChildren<{ title?: string }>) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.groupWrap}>
      {!!title && <AppText style={styles.groupTitle}>{title}</AppText>}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.divider} />}
            {row}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  subtitle,
  count,
  href,
  tone = 'default',
}: {
  icon: IconName;
  label: string;
  subtitle?: string;
  count?: number;
  href: Href;
  tone?: 'default' | 'muted';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, subtitle, count ? `${count} items` : null]
        .filter(Boolean)
        .join(', ')}
      onPress={() => router.push(href)}
      android_ripple={{ color: '#E5E7EB' }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, tone === 'muted' && styles.rowIconMuted]}>
        <Ionicons
          name={icon}
          size={19}
          color={tone === 'muted' ? MUTED : theme.colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <AppText style={styles.rowLabel}>{label}</AppText>
        {!!subtitle && (
          <AppText numberOfLines={1} style={styles.rowSubtitle}>
            {subtitle}
          </AppText>
        )}
      </View>
      {!!count && count > 0 && (
        <View style={styles.count}>
          <AppText style={styles.countText}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={FAINT} />
    </Pressable>
  );
}

function OrderTile({
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
      style={({ pressed }) => [styles.tile, pressed && styles.rowPressed]}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <AppText numberOfLines={1} style={styles.tileLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

function OrdersCard() {
  const orders = useOrders();
  const latest = orders.data?.pages[0]?.items[0];
  const tone = latest ? orderStatusColor(latest.orderStatus) : null;
  return (
    <View style={styles.groupWrap}>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <AppText style={styles.cardTitle}>My orders</AppText>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/orders')}
            hitSlop={10}
            style={styles.viewAll}
          >
            <AppText style={styles.viewAllText}>View all</AppText>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
        <View style={styles.tiles}>
          <OrderTile icon="cube-outline" label="Ongoing" view="ongoing" />
          <OrderTile
            icon="checkmark-done-outline"
            label="Delivered"
            view="completed"
          />
          <OrderTile
            icon="return-down-back-outline"
            label="Returns"
            view="returns"
          />
          <OrderTile
            icon="close-circle-outline"
            label="Cancelled"
            view="cancelled"
          />
        </View>
        {orders.isPending ? (
          <SkeletonBlock style={styles.latestSkeleton} />
        ) : latest && tone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Latest order ${
              latest.orderNumber
            }, ${orderStatusLabel(latest.orderStatus)}`}
            onPress={() =>
              router.push({
                pathname: '/orders/[id]',
                params: { id: latest.id },
              })
            }
            style={({ pressed }) => [
              styles.latest,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.latestIcon}>
              <Ionicons name="bag-handle-outline" size={18} color={MUTED} />
            </View>
            <View style={styles.rowText}>
              <AppText style={styles.latestTitle}>
                Order #{latest.orderNumber}
              </AppText>
              <AppText style={styles.rowSubtitle}>
                {new Date(latest.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                · {latest.totalItems} item{latest.totalItems === 1 ? '' : 's'} ·{' '}
                {money(latest.grandTotal)}
              </AppText>
            </View>
            <View style={[styles.pill, { backgroundColor: tone.bg }]}>
              <AppText style={[styles.pillText, { color: tone.text }]}>
                {orderStatusLabel(latest.orderStatus)}
              </AppText>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function GuestCard() {
  const benefits: { icon: IconName; label: string }[] = [
    { icon: 'cube-outline', label: 'Track orders' },
    { icon: 'heart-outline', label: 'Save favourites' },
    { icon: 'flash-outline', label: 'Faster checkout' },
  ];
  return (
    <View style={[styles.card, styles.hero, styles.guest]}>
      <View style={styles.guestAvatar}>
        <Ionicons
          name="person-outline"
          size={28}
          color={theme.colors.primary}
        />
      </View>
      <AppText style={styles.guestTitle}>Welcome to Elexify</AppText>
      <AppText style={styles.guestMessage}>
        Sign in with your mobile number to track orders, save addresses and
        check out faster.
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/login')}
        style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
      >
        <AppText style={styles.primaryText}>Sign in or create account</AppText>
      </Pressable>
      <View style={styles.benefits}>
        {benefits.map(b => (
          <View key={b.label} style={styles.benefit}>
            <Ionicons name={b.icon} size={18} color={theme.colors.primary} />
            <AppText style={styles.benefitText}>{b.label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AccountScreen() {
  const status = useSession(s => s.status);
  const signOut = useSession(s => s.signOut);
  const confirm = useConfirm();
  const account = useAccount();
  const addresses = useAddresses();
  const wishlist = useWishlist();
  const orders = useOrders();
  const compareCount = useCompareStore(s => s.items.length);
  const [refreshing, setRefreshing] = useState(false);
  const signedIn = status === 'authenticated';

  const wishlistCount = wishlist.data?.pages[0]?.total ?? 0;
  const preferred =
    addresses.data?.items.find(item => item.isDefault) ??
    addresses.data?.items[0];
  const addressSummary = preferred
    ? [preferred.addressLine1, preferred.city.name].filter(Boolean).join(', ')
    : 'Add a delivery address';
  const name =
    [account.data?.firstName, account.data?.lastName]
      .filter(Boolean)
      .join(' ') || 'Your account';
  const initials =
    [account.data?.firstName?.[0], account.data?.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || 'E';
  const contact = [
    account.data?.mobile ? `+91 ${account.data.mobile}` : null,
    account.data?.email,
  ].filter(Boolean) as string[];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      account.refetch(),
      addresses.refetch(),
      wishlist.refetch(),
      orders.refetch(),
    ]);
    setRefreshing(false);
  };

  return (
    <View style={[shop.page, styles.page]}>
      <ShopHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          signedIn ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          ) : undefined
        }
      >
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

        {status === 'guest' && <GuestCard />}

        {signedIn && (
          <>
            <View style={[styles.card, styles.hero]}>
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  <AppText style={styles.initials}>{initials}</AppText>
                </View>
                <View style={styles.rowText}>
                  {account.isPending ? (
                    <>
                      <SkeletonBlock style={styles.nameSkeleton} />
                      <SkeletonBlock style={styles.detailSkeleton} />
                    </>
                  ) : (
                    <>
                      <AppText numberOfLines={1} style={styles.name}>
                        {name}
                      </AppText>
                      {contact.map(line => (
                        <AppText
                          key={line}
                          numberOfLines={1}
                          style={styles.contact}
                        >
                          {line}
                        </AppText>
                      ))}
                    </>
                  )}
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/account/profile')}
                style={({ pressed }) => [
                  styles.editProfile,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={theme.colors.primary}
                />
                <AppText style={styles.editProfileText}>Edit profile</AppText>
              </Pressable>
            </View>
            {account.isError && (
              <Feedback
                title="Unable to load your details"
                message={account.error.message}
                onRetry={() => account.refetch().catch(() => undefined)}
              />
            )}

            <OrdersCard />

            <Group title="Shopping">
              <Row icon="notifications-outline" label="Notifications" href={"/notifications" as Href} />
              <Row
                icon="heart-outline"
                label="Wishlist"
                count={wishlistCount}
                href="/wishlist"
              />
              <Row
                icon="location-outline"
                label="Saved addresses"
                subtitle={addressSummary}
                href="/addresses"
              />
              <Row
                icon="time-outline"
                label="Recently viewed"
                href="/recently-viewed"
              />
              <Row
                icon="git-compare-outline"
                label="Compare products"
                count={compareCount}
                href="/compare"
              />
            </Group>

            <Group title="Account settings">
              <Row
                icon="person-outline"
                label="Profile"
                subtitle="Name, email and personal details"
                href="/account/profile"
              />
              <Row
                icon="shield-checkmark-outline"
                label="Login & security"
                subtitle="Mobile number, email and linked accounts"
                href="/account/security"
              />
              <Row
                icon="notifications-outline"
                label="Notifications"
                subtitle="Order updates and offers"
                href="/account/preferences"
              />
            </Group>
          </>
        )}

        {/* Compare doesn't need sign-in, so guests keep a way to it. */}
        {status === 'guest' && (
          <Group title="Shopping">
            <Row
              icon="git-compare-outline"
              label="Compare products"
              count={compareCount}
              href="/compare"
            />
          </Group>
        )}

        {/* Support/legal must be reachable without signing in — App Store
            and Play Store review both require a reachable privacy policy. */}
        <Group title="Help & support">
          <Row icon="help-circle-outline" label="FAQs" href="/faq" />
          <Row
            icon="chatbubble-ellipses-outline"
            label="Contact us"
            subtitle="We usually reply within a day"
            href="/contact-us"
          />
        </Group>

        <Group title="About">
          <Row
            icon="information-circle-outline"
            label="About Elexify"
            href={legal('about-us')}
            tone="muted"
          />
          <Row
            icon="lock-closed-outline"
            label="Privacy policy"
            href={legal('privacy-policy')}
            tone="muted"
          />
          <Row
            icon="document-text-outline"
            label="Terms & conditions"
            href={legal('terms-conditions')}
            tone="muted"
          />
          <Row
            icon="return-up-back-outline"
            label="Refund & cancellation policy"
            href={legal('refund-cancellations-policy')}
            tone="muted"
          />
        </Group>

        {signedIn && (
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
            style={({ pressed }) => [
              styles.card,
              styles.signOut,
              pressed && styles.rowPressed,
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color={theme.colors.danger}
            />
            <AppText style={styles.signOutText}>Sign out</AppText>
          </Pressable>
        )}

        <AppText style={styles.footer}>
          Elexify · Find the parts. Build your next idea.
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: PAGE_BG },
  content: { padding: 16, paddingBottom: 40, gap: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  hero: { padding: 16, gap: 14 },
  groupWrap: { gap: 8 },
  groupTitle: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: theme.fonts.semibold,
    color: MUTED,
    paddingHorizontal: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 64,
  },

  // Profile
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  initials: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 22,
  },
  name: {
    fontFamily: theme.fonts.semibold,
    fontSize: 18,
    color: theme.colors.text,
  },
  contact: { fontSize: 13, color: MUTED, lineHeight: 19 },
  nameSkeleton: { height: 18, width: '60%', borderRadius: 6, marginBottom: 6 },
  detailSkeleton: { height: 12, width: '80%', borderRadius: 6 },
  editProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: TILE_BG,
  },
  editProfileText: {
    fontFamily: theme.fonts.semibold,
    fontSize: 14,
    color: theme.colors.primary,
  },

  // Orders
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  cardTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 16,
    color: theme.colors.text,
  },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    color: theme.colors.primary,
  },
  tiles: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TILE_BG,
  },
  tileLabel: { fontSize: 12, color: theme.colors.text },
  latest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  latestSkeleton: {
    height: 58,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
  },
  latestIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  latestTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    color: theme.colors.text,
  },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 11, fontFamily: theme.fonts.semibold },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowPressed: { backgroundColor: '#F3F4F6' },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TILE_BG,
  },
  rowIconMuted: { backgroundColor: '#F3F4F6' },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    color: theme.colors.text,
  },
  rowSubtitle: { fontSize: 12, color: MUTED, marginTop: 1 },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TILE_BG,
  },
  countText: {
    fontSize: 12,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.primary,
  },

  // Guest
  guest: { alignItems: 'center', paddingVertical: 24 },
  guestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TILE_BG,
  },
  guestTitle: {
    fontFamily: theme.fonts.semibold,
    fontSize: 19,
    color: theme.colors.text,
  },
  guestMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    textAlign: 'center',
    marginTop: -6,
  },
  primary: {
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  pressed: { opacity: 0.85 },
  benefits: { flexDirection: 'row', alignSelf: 'stretch' },
  benefit: { flex: 1, alignItems: 'center', gap: 4 },
  benefitText: { fontSize: 11, color: MUTED, textAlign: 'center' },

  // Sign out + footer
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  signOutText: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.semibold,
    fontSize: 15,
  },
  footer: { textAlign: 'center', fontSize: 11, color: FAINT },
});
