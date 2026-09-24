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
import { ShopHeader, shop } from '../../components/shop';
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
