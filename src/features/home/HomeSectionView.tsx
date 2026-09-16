import React, { useEffect, useState } from 'react';
import {
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
  CategoryTile,
  ProductCard,
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
function ProductRail({ section }: { section: HomeSection }) {
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
    <View style={[styles.section, sale ? styles.sale : undefined]}>
      <SectionHeading section={section} onViewAll={viewAll} />
      {!!end && <Countdown end={end} />}
      <QueryState
        pending={query.isPending}
        error={query.error}
        paused={query.fetchStatus === 'paused'}
        retry={() => {
          query.refetch().catch(() => undefined);
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {query.data?.items.map(product => (
          <View key={product.key} style={styles.product}>
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
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
      <SectionHeading
        section={section}
        onViewAll={() => router.push('/categories')}
      />
      <QueryState
        pending={query.isPending}
        error={query.error}
        paused={query.fetchStatus === 'paused'}
        retry={() => {
          query.refetch().catch(() => undefined);
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {query.data?.items.map(category => (
          <View key={category.id} style={styles.category}>
            <CategoryTile category={category} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
function Hero({ section }: { section: HomeSection }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 44, 560);
  const [active, setActive] = useState(0);
  const slides = (
    Array.isArray(section.config.slides) ? section.config.slides : []
  )
    .map(record)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  if (!slides.length) {
    return null;
  }
  return (
    <View style={styles.heroSection}>
      <ScrollView
        horizontal
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.heroRail}
        onMomentumScrollEnd={e =>
          setActive(
            Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)),
          )
        }
      >
        {slides.map((slide, index) => {
          const primary = record(slide.primary_cta);
          const secondary = record(slide.secondary_cta);
          const image =
            imageUrl(slide.mobile_image) || imageUrl(slide.desktop_image);
          return (
            <View key={index} style={[styles.hero, { width: cardWidth }]}>
              {image && (
                <StoreImage
                  uri={image}
                  label={string(slide.heading) || 'Featured collection'}
                  style={styles.heroImage}
                />
              )}
              <View style={styles.heroCopy}>
                {!!slide.heading && (
                  <AppText style={styles.heroTitle}>
                    {string(slide.heading)}
                  </AppText>
                )}
                {!!slide.description && (
                  <AppText style={styles.heroDescription}>
                    {string(slide.description)}
                  </AppText>
                )}
                {[primary, secondary]
                  .filter(
                    cta =>
                      string(cta.label) && resolveStoreLink(string(cta.link)),
                  )
                  .map((cta, i) => (
                    <Button
                      key={i}
                      label={string(cta.label)}
                      onPress={() => openStoreLink(string(cta.link))}
                    />
                  ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
      {slides.length > 1 && (
        <View
          accessible
          accessibilityLabel={`Banner ${Math.min(
            active + 1,
            slides.length,
          )} of ${slides.length}`}
          style={styles.dots}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>
      )}
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
  section: { padding: 16, gap: 14 },
  sale: { backgroundColor: '#FFF5E7' },
  viewAll: { minHeight: 44, justifyContent: 'center' },
  rail: { gap: 12 },
  product: { width: 190 },
  category: { width: 112 },
  counter: {
    color: '#FFFFFF',
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 5,
    fontFamily: theme.fonts.bold,
  },
  heroSection: { gap: 10, paddingVertical: 8 },
  heroRail: { paddingHorizontal: 16, gap: 12 },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', aspectRatio: 2.05, backgroundColor: '#E0F2F1' },
  heroCopy: { padding: 18, gap: 10 },
  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  heroDescription: { color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  dotActive: { width: 18, backgroundColor: theme.colors.primary },
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
