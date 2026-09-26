import React from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from '@native-html/render';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppText } from '../../components/ui';
import { ShopHeader, SkeletonBlock, shop } from '../../components/shop';
import { theme } from '../../theme';
import { QueryState } from '../catalog/QueryState';
import { fetchCmsPage } from '../../api/cms';

// One screen reused for every legal/support page (About Us, Privacy Policy,
// Terms & Conditions, Refund & Cancellation Policy) — the slug is the route
// param, matching the backend's GET site/cms/page/:slug contract and the
// web storefront's equivalent static pages.
const TITLES: Record<string, string> = {
  'about-us': 'About Us',
  'privacy-policy': 'Privacy Policy',
  'terms-conditions': 'Terms & Conditions',
  'refund-cancellations-policy': 'Refund & Cancellation Policy',
};

const EYEBROWS: Record<string, string> = {
  'about-us': 'About Elexify',
  'privacy-policy': 'Legal',
  'terms-conditions': 'Legal',
  'refund-cancellations-policy': 'Policies',
};

const htmlStyles = {
  p: { marginBottom: 10 },
  h1: { fontFamily: theme.fonts.bold },
  h2: { fontFamily: theme.fonts.bold },
  h3: { fontFamily: theme.fonts.semibold },
  li: { marginBottom: 4 },
  a: { color: theme.colors.primary },
};
const htmlBaseStyle = {
  fontFamily: theme.fonts.regular,
  fontSize: 14,
  lineHeight: 21,
  color: theme.colors.text,
};

function CmsPageSkeleton() {
  return (
    <View
      accessibilityLabel="Loading page content"
      accessibilityLiveRegion="polite"
      importantForAccessibility="no-hide-descendants"
      style={styles.cmsSkeleton}
    >
      <View style={styles.heroSkeleton}>
        <SkeletonBlock style={styles.skeletonEyebrow} />
        <SkeletonBlock style={styles.skeletonTitle} />
        <View style={styles.skeletonTextGroup}>
          <SkeletonBlock style={styles.skeletonParagraph} />
          <SkeletonBlock style={styles.skeletonParagraphMedium} />
        </View>
      </View>

      <View style={styles.contentSkeleton}>
        {[0, 1, 2].map(section => (
          <View key={section} style={styles.skeletonSection}>
            <SkeletonBlock style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonTextGroup}>
              <SkeletonBlock style={styles.skeletonParagraph} />
              <SkeletonBlock style={styles.skeletonParagraph} />
              <SkeletonBlock style={styles.skeletonParagraphShort} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CmsPageScreen() {
  const { width } = useWindowDimensions();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: ({ signal }) => fetchCmsPage(slug, signal),
    enabled: !!slug,
  });

  return (
    <View style={shop.page}>
      <ShopHeader title={TITLES[slug] ?? query.data?.title ?? 'Page'} back />
      <ScrollView contentContainerStyle={styles.body}>
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => {
            query.refetch().catch(() => undefined);
          }}
          skeleton={<CmsPageSkeleton />}
        />
        {query.data && (
          <View style={styles.hero}>
            <AppText style={styles.eyebrow}>
              {EYEBROWS[slug] ?? 'Information'}
            </AppText>
            <AppText style={styles.title}>
              {TITLES[slug] ?? query.data.title}
            </AppText>
            {!!query.data.shortDescription && (
              <AppText style={styles.lead}>
                {query.data.shortDescription}
              </AppText>
            )}
          </View>
        )}
        {query.data && !query.data.content && (
          <View style={styles.card}>
            <AppText style={shop.muted}>This page has no content yet.</AppText>
          </View>
        )}
        {query.data?.content && (
          <View style={styles.card}>
            <RenderHtml
              contentWidth={width - 64}
              source={{ html: query.data.content }}
              tagsStyles={htmlStyles}
              baseStyle={htmlBaseStyle}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32, gap: 16 },
  cmsSkeleton: { gap: 16 },
  heroSkeleton: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  contentSkeleton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    padding: 18,
    gap: 22,
  },
  skeletonSection: { gap: 12 },
  skeletonTextGroup: { gap: 8 },
  skeletonEyebrow: {
    height: 10,
    width: 92,
    backgroundColor: '#B9DED8',
  },
  skeletonTitle: {
    height: 25,
    width: '66%',
    backgroundColor: '#B9DED8',
  },
  skeletonSectionTitle: { height: 17, width: '54%' },
  skeletonParagraph: { height: 12, width: '100%' },
  skeletonParagraphMedium: { height: 12, width: '78%', backgroundColor: '#B9DED8' },
  skeletonParagraphShort: { height: 12, width: '62%' },
  hero: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.text,
  },
  lead: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    padding: 18,
  },
});
