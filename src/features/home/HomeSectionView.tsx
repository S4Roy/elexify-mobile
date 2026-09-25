import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from '../../components/ui';
import { ProductCard, SkeletonBlock, StoreImage } from '../../components/shop';
import {
  fetchCategories,
  fetchProducts,
  HomeSection,
  imageUrl,
  record,
  resolvedQuery,
  string,
} from '../../api/discovery';
import { useIdentity } from '../catalog/hooks';
import { QueryState } from '../catalog/QueryState';
import { openStoreLink, resolveStoreLink } from '../catalog/links';
import { plainText } from '../../utils/html';
import { theme } from '../../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const GUTTER = 16;
const RAIL_GAP = 10;
/** Product cards per screen width in a rail — the fraction leaves a peek of
 * the next card so the rail reads as scrollable. */
const CARDS_PER_VIEW = 2.3;
const CATEGORY_SIZE = 64;
const SALE = { bg: '#FFF7ED', border: '#FED7AA', ink: '#C2410C' };

// Same keys the CMS uses for the web trust badges (lucide icon names).
const TRUST_ICONS: Record<string, IconName> = {
  store: 'storefront-outline',
  truck: 'car-outline',
  shield: 'shield-checkmark-outline',
  card: 'card-outline',
  zap: 'flash-outline',
  gift: 'gift-outline',
  tag: 'pricetag-outline',
  package: 'cube-outline',
  headset: 'headset-outline',
  clock: 'time-outline',
};

function useRailCardWidth() {
  const { width } = useWindowDimensions();
  const usable = width - GUTTER - RAIL_GAP * Math.floor(CARDS_PER_VIEW);
  return Math.round(Math.min(200, Math.max(138, usable / CARDS_PER_VIEW)));
}

function SectionHeading({
  title,
  subtitle,
  icon,
  tone = 'default',
  onViewAll,
  accessory,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  tone?: 'default' | 'sale';
  onViewAll?: () => void;
  accessory?: React.ReactNode;
}) {
  const sale = tone === 'sale';
  return (
    <View style={styles.headingRow}>
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          {!!icon && (
            <View style={[styles.titleIcon, sale && styles.titleIconSale]}>
              <Ionicons name={icon} size={14} color="#FFFFFF" />
            </View>
          )}
          <AppText
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.title, sale && { color: SALE.ink }]}
          >
            {title}
          </AppText>
        </View>
        {!!subtitle && (
          <AppText numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
        {accessory}
      </View>
      {onViewAll && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View all ${title}`}
          onPress={onViewAll}
          hitSlop={8}
          style={({ pressed }) => [
            styles.viewAll,
            sale && styles.viewAllSale,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={[styles.viewAllText, sale && { color: SALE.ink }]}>
            View all
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={sale ? SALE.ink : theme.colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

function Countdown({ end }: { end: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.floor((Date.parse(end) - now) / 1000);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const parts = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60,
  ];
  return (
    <View
      accessible
      accessibilityLabel={`Offer ends in ${parts[0]} hours ${parts[1]} minutes`}
      style={styles.countdown}
    >
      <Ionicons name="time-outline" size={13} color={SALE.ink} />
      <AppText style={styles.countdownLabel}>Ends in</AppText>
      {parts.map((v, i) => (
        <React.Fragment key={i}>
          {i > 0 && <AppText style={styles.countdownColon}>:</AppText>}
          <AppText style={styles.counter}>{String(v).padStart(2, '0')}</AppText>
        </React.Fragment>
      ))}
    </View>
  );
}

/** Shimmering placeholder matching a product rail card, shown while its section's products are first loading. */
function ProductRailSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View
      style={[styles.rail, styles.skeletonRow]}
      accessibilityLabel="Loading products"
    >
      {[0, 1, 2].map(item => (
        <View key={item} style={[styles.productSkeleton, { width: cardWidth }]}>
          <SkeletonBlock style={styles.productSkeletonImage} />
          <SkeletonBlock style={styles.skeletonLineNarrow} />
          <SkeletonBlock style={styles.skeletonLineWide} />
          <SkeletonBlock style={styles.skeletonLineMedium} />
          <SkeletonBlock style={styles.skeletonButton} />
        </View>
      ))}
    </View>
  );
}

/** Shimmering placeholder matching the category circles, shown while its section's categories are first loading. */
function CategoryRailSkeleton() {
  return (
    <View
      style={[styles.rail, styles.skeletonRow]}
      accessibilityLabel="Loading categories"
    >
      {[0, 1, 2, 3, 4].map(item => (
        <View key={item} style={styles.category}>
          <SkeletonBlock style={styles.categorySkeletonCircle} />
          <SkeletonBlock style={styles.categorySkeletonLabel} />
        </View>
      ))}
    </View>
  );
}

function ProductRail({ section }: { section: HomeSection }) {
  const cardWidth = useRailCardWidth();
  const identity = useIdentity();
  const params = resolvedQuery(section.config.resolved_query, 'product');
  const query = useQuery({
    queryKey: ['home-section', identity, section.id, params],
    queryFn: ({ signal }) => fetchProducts(params, 1, signal),
  });
  const end = string(section.config.countdown_end_at);
  const sale = !!end || section.config.badge_icon === 'zap';
  const viewAll = () => {
    const link = string(section.config.view_all_link);
    if (link && resolveStoreLink(link)) {
      openStoreLink(link);
    } else {
      router.push({
        pathname: '/products',
        params: { ...params, title: section.title },
      });
    }
  };
  if (query.data?.items.length === 0) {
    return null;
  }
  const content = (
    <>
      <View style={styles.sectionHead}>
        <SectionHeading
          title={sale ? 'Flash Sale' : section.title}
          subtitle={sale ? section.title : section.subtitle}
          icon={sale ? 'flash' : undefined}
          tone={sale ? 'sale' : 'default'}
          onViewAll={viewAll}
          accessory={end ? <Countdown end={end} /> : null}
        />
      </View>
      <QueryState
        pending={query.isPending}
        error={query.error}
        paused={query.fetchStatus === 'paused'}
        retry={() => {
          query.refetch().catch(() => undefined);
        }}
        skeleton={<ProductRailSkeleton cardWidth={cardWidth} />}
      />
      {!!query.data?.items.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + RAIL_GAP}
          snapToAlignment="start"
          contentContainerStyle={styles.rail}
        >
          {query.data.items.map(product => (
            <View key={product.key} style={{ width: cardWidth }}>
              <ProductCard product={product} />
            </View>
          ))}
        </ScrollView>
      )}
    </>
  );
  return sale ? (
    <View style={styles.saleWrap}>
      <View style={styles.saleCard}>{content}</View>
    </View>
  ) : (
    <View style={styles.section}>{content}</View>
  );
}

function CategoryRail({ section }: { section: HomeSection }) {
  const identity = useIdentity();
  const params = resolvedQuery(section.config.resolved_query, 'category');
  const query = useQuery({
    queryKey: ['home-section', identity, section.id, params],
    queryFn: ({ signal }) => fetchCategories(params, 1, signal),
  });
  if (query.data?.items.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <SectionHeading
          title="Shop by category"
          onViewAll={() => router.push('/categories')}
        />
      </View>
      <QueryState
        pending={query.isPending}
        error={query.error}
        paused={query.fetchStatus === 'paused'}
        retry={() => {
          query.refetch().catch(() => undefined);
        }}
        skeleton={<CategoryRailSkeleton />}
      />
      {!!query.data?.items.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {query.data.items.map(category => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={category.name}
              onPress={() =>
                router.push({
                  pathname: '/products',
                  params: { category: category.slug, title: category.name },
                })
              }
              style={({ pressed }) => [
                styles.category,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.categoryCircle}>
                <StoreImage
                  uri={category.image}
                  label=""
                  style={styles.categoryImage}
                />
              </View>
              <AppText numberOfLines={2} style={styles.categoryName}>
                {category.name}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Hero({ section }: { section: HomeSection }) {
  const { width } = useWindowDimensions();
  const cardWidth = width - GUTTER * 2;
  const cardHeight = Math.round(Math.min(200, Math.max(150, cardWidth * 0.46)));
  const step = cardWidth + 10;
  const [active, setActive] = useState(0);
  const rail = useRef<ScrollView>(null);
  const slides = (
    Array.isArray(section.config.slides) ? section.config.slides : []
  )
    .map(record)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const goToSlide = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, slides.length - 1));
      rail.current?.scrollTo({ x: next * step, animated: true });
      setActive(next);
    },
    [step, slides.length],
  );
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setTimeout(
      () => goToSlide((active + 1) % slides.length),
      5500,
    );
    return () => clearTimeout(timer);
  }, [active, goToSlide, slides.length]);
  if (!slides.length) {
    return null;
  }
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActive(
      Math.max(
        0,
        Math.min(
          slides.length - 1,
          Math.round(e.nativeEvent.contentOffset.x / step),
        ),
      ),
    );
  return (
    <View style={styles.heroSection}>
      <ScrollView
        ref={rail}
        horizontal
        scrollEnabled={slides.length > 1}
        nestedScrollEnabled
        snapToInterval={step}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
        contentContainerStyle={styles.heroRail}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
      >
        {slides.map((slide, index) => {
          const primary = record(slide.primary_cta);
          const secondary = record(slide.secondary_cta);
          const cta = [primary, secondary].find(
            c => string(c.label) && resolveStoreLink(string(c.link)),
          );
          const heading = string(slide.heading);
          const image =
            imageUrl(slide.mobile_image) || imageUrl(slide.desktop_image);
          const amplifier = /amplifier boards/i.test(heading);
          const hasImage = !!image || amplifier;
          return (
            <Pressable
              key={index}
              accessibilityRole={cta ? 'button' : undefined}
              accessibilityLabel={[heading, string(slide.description)]
                .filter(Boolean)
                .join('. ')}
              disabled={!cta}
              onPress={() => cta && openStoreLink(string(cta.link))}
              style={[styles.hero, { width: cardWidth, height: cardHeight }]}
            >
              <View pointerEvents="none" style={styles.heroBlobLarge} />
              <View pointerEvents="none" style={styles.heroBlobSmall} />
              <View style={styles.heroCopy}>
                {!!heading && (
                  <AppText numberOfLines={2} style={styles.heroTitle}>
                    {heading}
                  </AppText>
                )}
                {!!slide.description && (
                  <AppText numberOfLines={2} style={styles.heroDescription}>
                    {string(slide.description)}
                  </AppText>
                )}
                {cta && (
                  <View style={styles.heroCta}>
                    <AppText style={styles.heroCtaText}>
                      {string(cta.label)}
                    </AppText>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={theme.colors.primaryDark}
                    />
                  </View>
                )}
              </View>
              {hasImage && (
                <View
                  style={[
                    styles.heroImageWrap,
                    { width: cardHeight * 0.62, height: cardHeight * 0.72 },
                  ]}
                >
                  {amplifier ? (
                    <Image
                      source={require('../../assets/images/HeroAmplifier.png')}
                      accessibilityLabel="Amplifier circuit board"
                      resizeMode="cover"
                      style={styles.heroImage}
                    />
                  ) : (
                    <StoreImage
                      uri={image}
                      label={heading || 'Featured collection'}
                      style={styles.heroImage}
                    />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Show banner ${i + 1} of ${slides.length}`}
              accessibilityState={{ selected: i === active }}
              onPress={() => goToSlide(i)}
              hitSlop={8}
              style={styles.dotTouch}
            >
              <View style={[styles.dot, i === active && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/** Full-page shimmering placeholder shown while the home feed's section list is first loading — mirrors the hero banner + category row + product rail shape so there's no layout jump once real sections arrive. */
export function HomeSkeleton() {
  const { width } = useWindowDimensions();
  const cardWidth = useRailCardWidth();
  const heroWidth = width - GUTTER * 2;
  return (
    <View accessibilityLabel="Loading home">
      <View style={styles.heroSection}>
        <SkeletonBlock
          style={[
            styles.heroSkeleton,
            {
              width: heroWidth,
              height: Math.round(
                Math.min(200, Math.max(150, heroWidth * 0.46)),
              ),
            },
          ]}
        />
        <View style={styles.dots}>
          <SkeletonBlock style={styles.dotSkeletonActive} />
          <SkeletonBlock style={styles.dotSkeleton} />
          <SkeletonBlock style={styles.dotSkeleton} />
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <SkeletonBlock style={styles.skeletonSectionTitle} />
        </View>
        <CategoryRailSkeleton />
      </View>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <SkeletonBlock style={styles.skeletonSectionTitle} />
        </View>
        <ProductRailSkeleton cardWidth={cardWidth} />
      </View>
    </View>
  );
}

function TrustBadges({ section }: { section: HomeSection }) {
  const items = (
    Array.isArray(section.config.items) ? section.config.items : []
  )
    .map(record)
    .filter(item => string(item.label));
  if (!items.length) {
    return null;
  }
  return (
    <View style={styles.section}>
      <View style={styles.trust}>
        {items.map((item, index) => (
          <View key={index} style={styles.trustItem}>
            <View style={styles.trustIcon}>
              <Ionicons
                name={TRUST_ICONS[string(item.icon)] ?? 'storefront-outline'}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.flex}>
              <AppText numberOfLines={1} style={styles.trustLabel}>
                {string(item.label)}
              </AppText>
              {!!string(item.sub) && (
                <AppText numberOfLines={2} style={styles.trustSub}>
                  {string(item.sub)}
                </AppText>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CtaBanner({ section }: { section: HomeSection }) {
  const link = string(section.config.button_link);
  const label = string(section.config.button_label);
  const canOpen = !!label && !!resolveStoreLink(link);
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole={canOpen ? 'button' : undefined}
        disabled={!canOpen}
        onPress={() => openStoreLink(link)}
        style={({ pressed }) => [styles.promo, pressed && styles.pressed]}
      >
        <View pointerEvents="none" style={styles.promoBlob} />
        <AppText style={styles.promoTitle}>
          {string(section.config.heading)}
        </AppText>
        {!!string(section.config.description) && (
          <AppText style={styles.promoText}>
            {string(section.config.description)}
          </AppText>
        )}
        {canOpen && (
          <View style={styles.heroCta}>
            <AppText style={styles.heroCtaText}>{label}</AppText>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={theme.colors.primaryDark}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const CONTENT_PREVIEW_LINES = 4;

/** CMS copy (e.g. "About us") — long on the web for SEO, so collapsed to a
 * short preview on mobile with a Read more toggle. */
function ContentSection({ section }: { section: HomeSection }) {
  const [open, setOpen] = useState(false);
  const body = plainText(string(section.config.body)).trim();
  if (!body && !section.title) {
    return null;
  }
  const long =
    body.length > 240 || body.split('\n').length > CONTENT_PREVIEW_LINES;
  return (
    <View style={styles.section}>
      <View style={styles.contentCard}>
        {!!section.title && (
          <SectionHeading title={section.title} subtitle={section.subtitle} />
        )}
        {!!body && (
          <AppText
            numberOfLines={open || !long ? undefined : CONTENT_PREVIEW_LINES}
            style={styles.contentBody}
          >
            {body}
          </AppText>
        )}
        {long && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen(o => !o)}
            hitSlop={8}
            style={styles.readMore}
          >
            <AppText style={styles.readMoreText}>
              {open ? 'Show less' : 'Read more'}
            </AppText>
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function HomeSectionView({ section }: { section: HomeSection }) {
  if (section.type === 'hero') {
    return <Hero section={section} />;
  }
  if (section.type === 'product_section') {
    return <ProductRail section={section} />;
  }
  if (section.type === 'category_section') {
    return <CategoryRail section={section} />;
  }
  if (section.type === 'trust_badges') {
    return <TrustBadges section={section} />;
  }
  if (section.type === 'cta_banner') {
    return <CtaBanner section={section} />;
  }
  if (section.type === 'content_section') {
    return <ContentSection section={section} />;
  }
  return null;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
  section: { paddingVertical: 14, gap: 12 },
  sectionHead: { paddingHorizontal: GUTTER },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  titleIconSale: { backgroundColor: '#EA580C' },
  title: {
    flexShrink: 1,
    fontFamily: theme.fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.secondary,
    marginTop: 1,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 30,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 15,
    backgroundColor: theme.colors.primaryLight,
  },
  viewAllSale: { backgroundColor: '#FFEDD5' },
  viewAllText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  rail: { paddingHorizontal: GUTTER, gap: RAIL_GAP },

  // Flash sale
  saleWrap: { paddingHorizontal: 12, paddingVertical: 10 },
  saleCard: {
    gap: 12,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SALE.border,
    backgroundColor: SALE.bg,
    overflow: 'hidden',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  countdownLabel: {
    color: SALE.ink,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    marginRight: 2,
  },
  countdownColon: {
    color: SALE.ink,
    fontFamily: theme.fonts.bold,
    fontSize: 12,
  },
  counter: {
    minWidth: 26,
    textAlign: 'center',
    color: '#FFFFFF',
    backgroundColor: '#EA580C',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },

  // Categories
  category: { width: 76, alignItems: 'center', gap: 6 },
  categoryCircle: {
    width: CATEGORY_SIZE + 6,
    height: CATEGORY_SIZE + 6,
    borderRadius: (CATEGORY_SIZE + 6) / 2,
    padding: 3,
    backgroundColor: '#EEF7F5',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: CATEGORY_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  categoryName: {
    width: 76,
    color: theme.colors.text,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
    fontSize: 11.5,
    lineHeight: 15,
  },

  // Skeletons
  productSkeleton: {
    gap: 8,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EBEF',
  },
  productSkeletonImage: { width: '100%', aspectRatio: 1, borderRadius: 10 },
  skeletonLineNarrow: { height: 10, width: '40%' },
  skeletonLineWide: { height: 13, width: '92%' },
  skeletonLineMedium: { height: 13, width: '55%' },
  skeletonButton: { height: 34, borderRadius: 9 },
  skeletonRow: { flexDirection: 'row' },
  skeletonSectionTitle: { height: 18, width: 170, borderRadius: 6 },
  categorySkeletonCircle: {
    width: CATEGORY_SIZE + 6,
    height: CATEGORY_SIZE + 6,
    borderRadius: (CATEGORY_SIZE + 6) / 2,
  },
  categorySkeletonLabel: { height: 10, width: 56 },
  heroSkeleton: { marginLeft: GUTTER, borderRadius: 18 },
  dotSkeleton: { width: 6, height: 6, borderRadius: 3 },
  dotSkeletonActive: { width: 18, height: 6, borderRadius: 3 },

  // Hero
  heroSection: { paddingTop: 12, paddingBottom: 4 },
  heroRail: { paddingHorizontal: GUTTER, gap: 10 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#07907C',
  },
  heroBlobLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBlobSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -30,
    bottom: -60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroCopy: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    marginTop: 6,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  heroCtaText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
  },
  heroImageWrap: {
    marginRight: 18,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8F8F5',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroImage: { width: '100%', height: '100%' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
  },
  dotTouch: { paddingVertical: 4 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: { width: 18, backgroundColor: theme.colors.primary },

  // Trust badges
  trust: {
    marginHorizontal: GUTTER,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F6FAF9',
    borderWidth: 1,
    borderColor: '#E0EFEC',
  },
  trustItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  trustIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EBE7',
  },
  trustLabel: {
    fontFamily: theme.fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.text,
  },
  trustSub: { fontSize: 11, lineHeight: 15, color: theme.colors.secondary },

  // CTA banner
  promo: {
    marginHorizontal: GUTTER,
    borderRadius: 18,
    padding: 20,
    gap: 6,
    overflow: 'hidden',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryDark,
  },
  promoBlob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    bottom: -80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  promoTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    lineHeight: 25,
    color: '#FFFFFF',
  },
  promoText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 19 },

  contentCard: {
    marginHorizontal: GUTTER,
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFB',
  },
  contentBody: { fontSize: 13, lineHeight: 21, color: '#4B5563' },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
  },
  readMoreText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
});
