import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import RenderHtml from '@native-html/render';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppText, Button } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { QueryState } from '../catalog/QueryState';
import { fetchFaqs, type Faq } from '../../api/cms';

const answerHtmlStyles = {
  p: { marginBottom: 8 },
  a: { color: theme.colors.primary },
  strong: { fontFamily: theme.fonts.medium },
};
const answerHtmlBaseStyle = {
  fontFamily: theme.fonts.regular,
  fontSize: 13,
  lineHeight: 20,
  color: theme.colors.secondary,
};

function FaqRow({
  item,
  contentWidth,
  last,
}: {
  item: Faq;
  contentWidth: number;
  last: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(o => !o)}
        style={styles.rowHeader}
      >
        <AppText style={styles.question}>{item.question}</AppText>
        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <Ionicons
            name="chevron-down"
            size={16}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>
      {open && (
        <View style={styles.answer}>
          <RenderHtml
            contentWidth={contentWidth}
            source={{ html: item.answer }}
            tagsStyles={answerHtmlStyles}
            baseStyle={answerHtmlBaseStyle}
          />
        </View>
      )}
    </View>
  );
}

export default function FaqScreen() {
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['faqs'],
    queryFn: ({ signal }) => fetchFaqs(signal),
  });

  return (
    <View style={shop.page}>
      <ShopHeader title="FAQs" back />
      <ScrollView contentContainerStyle={styles.body}>
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => {
            query.refetch().catch(() => undefined);
          }}
        />
        {query.data?.length === 0 && (
          <AppText style={shop.muted}>No FAQs are available right now.</AppText>
        )}
        {query.data && query.data.length > 0 && (
          <View style={styles.card}>
            {query.data.map((item, index) => (
              <FaqRow
                key={item.id}
                item={item}
                contentWidth={width - 64}
                last={index === query.data.length - 1}
              />
            ))}
          </View>
        )}
        {query.data && (
          <View style={styles.contactPrompt}>
            <AppText style={shop.muted}>Still have questions?</AppText>
            <Button
              label="Contact us"
              onPress={() => router.push('/contact-us')}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32, gap: 4 },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 14,
  },
  rowLast: { borderBottomWidth: 0 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  question: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    flex: 1,
    lineHeight: 21,
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
  },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  answer: { marginTop: 10 },
  contactPrompt: { alignItems: 'center', gap: 10, marginTop: 24 },
});
