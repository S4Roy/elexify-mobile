import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
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

const htmlStyles = {
  p: { marginBottom: 10 },
  h1: { fontFamily: theme.fonts.bold },
  h2: { fontFamily: theme.fonts.bold },
  h3: { fontFamily: theme.fonts.semibold },
  li: { marginBottom: 4 },
  a: { color: theme.colors.primary },
};
const htmlBaseStyle = { fontFamily: theme.fonts.regular, fontSize: 14, lineHeight: 21, color: theme.colors.text };

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
        {query.data && !query.data.content && (
          <AppText style={shop.muted}>This page has no content yet.</AppText>
        )}
        {query.data?.content && (
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: query.data.content }}
            tagsStyles={htmlStyles}
            baseStyle={htmlBaseStyle}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
});
