import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, Button } from '../../components/ui';
import {
  ProductCard,
  SkeletonBlock,
  StoreImage,
  shop,
} from '../../components/shop';
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

function SectionHeading({
  section,
  onViewAll,
}: {
  section: HomeSection;
  onViewAll?: () => void;
}) {
  return (
    <View style={shop.between}>
      <View style={styles.flex}>
        <AppText accessibilityRole="header" style={shop.heading}>
          {section.title}
        </AppText>
        {!!section.subtitle && (
          <AppText style={shop.muted}>{section.subtitle}</AppText>
        )}
      </View>
      {onViewAll && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View all ${section.title}`}
          onPress={onViewAll}
          style={styles.viewAll}
        >
          <AppText style={shop.link}>View all</AppText>
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
      accessibilityLabel={`Offer ends in ${parts[0]} hours ${parts[1]} minutes`}
      style={shop.row}
    >
      {parts.map((v, i) => (
        <AppText key={i} style={styles.counter}>
          {String(v).padStart(2, '0')}
        </AppText>
      ))}
    </View>
  );
}
/** Shimmering placeholder matching a product rail card (image + name + price lines), shown while its section's products are first loading. */
function ProductRailSkeleton({ scale }: { scale: number }) {
  return (
    <View
      style={[styles.rail, styles.skeletonRow, { gap: 15 * scale }]}
      accessibilityLabel="Loading products"
    >
      {[0, 1, 2].map(item => (
        <View
          key={item}
          style={[
            styles.product,
            styles.productSkeleton,
            { width: 232 * scale },
          ]}
        >
          <SkeletonBlock style={styles.productSkeletonImage} />
          <SkeletonBlock style={styles.skeletonLineNarrow} />
          <SkeletonBlock style={styles.skeletonLineWide} />
          <SkeletonBlock style={styles.skeletonLineMedium} />
        </View>
      ))}
    </View>
  );
}
/** Shimmering placeholder matching a category rail item (circular badge + label), shown while its section's categories are first loading. */
function CategoryRailSkeleton({ scale }: { scale: number }) {
  return (
    <View
      style={[styles.rail, styles.skeletonRow, { gap: 9 * scale }]}
      accessibilityLabel="Loading categories"
    >
      {[0, 1, 2, 3, 4].map(item => (
        <View
          key={item}
          style={[
            styles.category,
            styles.categoryButton,
            { width: 110 * scale },
          ]}
        >
          <SkeletonBlock
            style={{
              width: 75 * scale,
              height: 75 * scale,
              borderRadius: 37.5 * scale,
            }}
          />
          <SkeletonBlock
            style={[styles.skeletonLineNarrow, { width: 70 * scale }]}
          />
        </View>
      ))}
    </View>
  );
}
function ProductRail({ section }: { section: HomeSection }) {
  const { width } = useWindowDimensions();
  const scale = width / 440;
  const identity = useIdentity();
  const params = resolvedQuery(section.config.resolved_query, 'product');
  const query = useQuery({
    queryKey: ['home-section', identity, section.id, params],
    queryFn: ({ signal }) => fetchProducts(params, 1, signal),
  });
  const end = string(section.config.countdown_end_at);
  const sale = end || section.config.badge_icon === 'zap';
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
  return (
    <View
      style={[
        styles.section,
        sale && styles.sale,
        sale && {
          paddingTop: 24 * scale,
          paddingBottom: 24 * scale,
          gap: 20 * scale,
        },
      ]}
    >
      <SectionHeading
        section={sale ? { ...section, title: 'Flash Sale' } : section}
        onViewAll={sale ? undefined : viewAll}
      />
      {!!end && <Countdown end={end} />}
      <QueryState
        pending={query.isPending}
        error={query.error}
        paused={query.fetchStatus === 'paused'}
        retry={() => {
          query.refetch().catch(() => undefined);
        }}
        skeleton={<ProductRailSkeleton scale={scale} />}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.rail, { gap: 15 * scale }]}
      >
        {query.data?.items.map(product => (
          <View
            key={product.key}
            style={[styles.product, { width: 232 * scale }]}
          >
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
function CategoryRail({ section }: { section: HomeSection }) {
  const { width } = useWindowDimensions();
  const scale = width / 440;
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
    <View
      style={[
        styles.section,
        {
          paddingTop: 20 * scale,
          paddingBottom: 35 * scale,
          paddingHorizontal: 16 * scale,
          gap: 14 * scale,
        },
      ]}
    >
      <SectionHeading section={{ ...section, title: 'Popular Categories' }} />
      <QueryState
        pending={query.isPending}
        error={query.error}
        paused={query.fetchStatus === 'paused'}
        retry={() => {
          query.refetch().catch(() => undefined);
        }}
        skeleton={<CategoryRailSkeleton scale={scale} />}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.rail, { gap: 9 * scale }]}
      >
        {query.data?.items.map(category => (
          <View
            key={category.id}
            style={[styles.category, { width: 110 * scale }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={category.name}
              onPress={() =>
                router.push({
                  pathname: '/products',
                  params: { category: category.slug, title: category.name },
                })
              }
              style={styles.categoryButton}
            >
              <StoreImage
                uri={category.image}
                label={category.name}
                style={[
                  styles.categoryImage,
                  {
                    width: 75 * scale,
                    height: 75 * scale,
                    borderRadius: 37.5 * scale,
                  },
                ]}
              />
              <AppText
                numberOfLines={1}
                style={[styles.categoryName, { width: 110 * scale }]}
              >
                {category.name}
              </AppText>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
function Hero({ section }: { section: HomeSection }) {
  const { width } = useWindowDimensions();
  const scale = width / 440;
  const cardWidth = 375 * scale;
  const [active, setActive] = useState(0);
  const rail = useRef<ScrollView>(null);
  const slides = (
    Array.isArray(section.config.slides) ? section.config.slides : []
  )
    .map(record)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  const slideStep = cardWidth + 17 * scale;
  const goToSlide = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, slides.length - 1));
      rail.current?.scrollTo({ x: next * slideStep, animated: true });
      setActive(next);
    },
    [slideStep, slides.length],
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
  return (
    <View style={[styles.heroSection, { paddingTop: 22 * scale }]}>
      <ScrollView
        ref={rail}
        horizontal
        scrollEnabled={slides.length > 1}
        nestedScrollEnabled
        snapToOffsets={slides.map((_, index) => index * slideStep)}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled
        contentContainerStyle={[
          styles.heroRail,
          {
            paddingLeft: 17 * scale,
            paddingRight: width - cardWidth - 17 * scale,
            gap: 17 * scale,
          },
        ]}
        onScrollEndDrag={e =>
          setActive(
            Math.max(
              0,
              Math.min(
                slides.length - 1,
                Math.round(e.nativeEvent.contentOffset.x / slideStep),
              ),
            ),
          )
        }
        onMomentumScrollEnd={e =>
          setActive(
            Math.max(
              0,
              Math.min(
                slides.length - 1,
                Math.round(e.nativeEvent.contentOffset.x / slideStep),
              ),
            ),
          )
        }
      >
        {slides.map((slide, index) => {
          const primary = record(slide.primary_cta);
          const secondary = record(slide.secondary_cta);
          const image =
            imageUrl(slide.mobile_image) || imageUrl(slide.desktop_image);
          return (
            <View
              key={index}
              style={[
                styles.hero,
                {
                  width: cardWidth,
                  height: 180 * scale,
                  borderRadius: 15 * scale,
                },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.heroAccent,
                  {
                    width: 150 * scale,
                    height: 150 * scale,
                    borderRadius: 75 * scale,
                    left: 150 * scale,
                    bottom: -100 * scale,
                  },
                ]}
              />
              <View
                style={[
                  styles.heroCopy,
                  {
                    paddingLeft: 40 * scale,
                    paddingRight: 8 * scale,
                    paddingVertical: 20 * scale,
                    gap: 8 * scale,
                  },
                ]}
              >
                {!!slide.heading && (
                  <AppText
                    style={[
                      styles.heroTitle,
                      { fontSize: 22 * scale, lineHeight: 29 * scale },
                    ]}
                  >
                    {string(slide.heading)}
                  </AppText>
                )}
                {!!slide.description && (
                  <AppText
                    style={[
                      styles.heroDescription,
                      { fontSize: 16 * scale, lineHeight: 22 * scale },
                    ]}
                  >
                    {string(slide.description)}
                  </AppText>
                )}
                {[primary, secondary]
                  .filter(
                    cta =>
                      string(cta.label) && resolveStoreLink(string(cta.link)),
                  )
                  .slice(0, 1)
                  .map((cta, i) => (
                    <Pressable
                      key={i}
                      accessibilityRole="button"
                      onPress={() => openStoreLink(string(cta.link))}
                      style={[
                        styles.heroCta,
                        {
                          minHeight: 36 * scale,
                          paddingHorizontal: 16 * scale,
                          borderRadius: 18 * scale,
                        },
                      ]}
                    >
                      <AppText
                        style={[styles.heroCtaText, { fontSize: 14 * scale }]}
                      >
                        {string(cta.label)}
                      </AppText>
                    </Pressable>
                  ))}
              </View>
              {(image || /amplifier boards/i.test(string(slide.heading))) && (
                <View
                  style={[
                    styles.heroImageWrap,
                    {
                      width: 86 * scale,
                      height: 102 * scale,
                      marginRight: 38 * scale,
                      borderWidth: 3 * scale,
                    },
                  ]}
                >
                  {/amplifier boards/i.test(string(slide.heading)) ? (
                    <Image
                      source={require('../../assets/images/HeroAmplifier.png')}
                      accessibilityLabel="Amplifier circuit board"
                      resizeMode="cover"
                      style={styles.heroImage}
                    />
                  ) : (
                    <StoreImage
                      uri={image}
                      label={string(slide.heading) || 'Featured collection'}
                      style={styles.heroImage}
                    />
                  )}
                </View>
              )}
            </View>
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
/** Full-page shimmering placeholder shown while the home feed's section list is first loading — mirrors the hero banner + category row + product rail shape instead of a generic bar so there's no layout jump once real sections arrive. */
export function HomeSkeleton() {
  const { width } = useWindowDimensions();
  const scale = width / 440;
  return (
    <View accessibilityLabel="Loading home">
      <View style={[styles.heroSection, { paddingTop: 22 * scale }]}>
        <SkeletonBlock
          style={{
            marginLeft: 17 * scale,
            width: 375 * scale,
            height: 180 * scale,
            borderRadius: 15 * scale,
          }}
        />
      </View>
      <View
        style={[
          styles.section,
          {
            paddingTop: 20 * scale,
            paddingBottom: 35 * scale,
            paddingHorizontal: 16 * scale,
            gap: 14 * scale,
          },
        ]}
      >
        <SkeletonBlock style={styles.skeletonSectionTitle} />
        <CategoryRailSkeleton scale={scale} />
      </View>
      <View style={styles.section}>
        <SkeletonBlock style={styles.skeletonSectionTitle} />
        <ProductRailSkeleton scale={scale} />
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
    const items = (
      Array.isArray(section.config.items) ? section.config.items : []
    ).map(record);
    return (
      <View style={styles.trust}>
        {items.map((item, index) => (
          <View key={index} style={styles.trustItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.flex}>
              <AppText>{string(item.label)}</AppText>
              <AppText style={shop.muted}>{string(item.sub)}</AppText>
            </View>
          </View>
        ))}
      </View>
    );
  }
  if (section.type === 'cta_banner') {
    const link = string(section.config.button_link);
    return (
      <View style={styles.section}>
        <View style={styles.promo}>
          <AppText style={styles.heroTitle}>
            {string(section.config.heading)}
          </AppText>
          <AppText style={styles.heroDescription}>
            {string(section.config.description)}
          </AppText>
          {string(section.config.button_label) && resolveStoreLink(link) ? (
            <Button
              label={string(section.config.button_label)}
              onPress={() => openStoreLink(link)}
            />
          ) : null}
        </View>
      </View>
    );
  }
  if (section.type === 'content_section') {
    return (
      <View style={styles.section}>
        <SectionHeading section={section} />
        <AppText>{plainText(string(section.config.body))}</AppText>
      </View>
    );
  }
  return null;
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { paddingHorizontal: 16, paddingVertical: 20, gap: 14 },
  sale: { backgroundColor: '#FFF5E7' },
  viewAll: { minHeight: 44, justifyContent: 'center' },
  rail: { gap: 12 },
  product: { width: 190 },
  category: { width: 96 },
  categoryButton: { alignItems: 'flex-start', gap: 8 },
  categoryImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: '#BBDCD6',
    backgroundColor: '#FFFFFF',
  },
  categoryName: {
    width: 96,
    color: theme.colors.primary,
    textAlign: 'left',
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  productSkeleton: { gap: 8 },
  productSkeletonImage: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  skeletonLineNarrow: { height: 11, width: '35%' },
  skeletonLineWide: { height: 13, width: '92%' },
  skeletonLineMedium: { height: 13, width: '55%' },
  skeletonRow: { flexDirection: 'row' },
  skeletonSectionTitle: { height: 20, width: 170, borderRadius: 6 },
  counter: {
    color: '#FFFFFF',
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 5,
    fontFamily: theme.fonts.bold,
  },
  heroSection: { paddingBottom: 0 },
  heroRail: { paddingHorizontal: 16, gap: 12 },
  hero: {
    flexDirection: 'row',
    backgroundColor: '#079C86',
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#22AF8D',
    left: 98,
    bottom: -108,
  },
  heroImageWrap: {
    width: '32%',
    height: 112,
    alignSelf: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E8F8F5',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  heroCopy: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  heroDescription: { color: '#FFFFFF', fontSize: 13, lineHeight: 19 },
  heroCta: {
    minHeight: 40,
    marginTop: 4,
    borderRadius: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semibold,
    fontSize: 13,
  },
  dots: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 2,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
  },
  dotTouch: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: { width: 18, backgroundColor: '#FFFFFF' },
  trust: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    gap: 16,
  },
  trustItem: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  promo: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
});
