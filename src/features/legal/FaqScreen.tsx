import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppText, Button } from '../../components/ui';
import { ShopHeader, shop } from '../../components/shop';
import { theme } from '../../theme';
import { QueryState } from '../catalog/QueryState';
import { fetchFaqs, type Faq } from '../../api/cms';

function FaqRow({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(o => !o)}
        style={styles.rowHeader}
      >
        <AppText style={styles.question}>{item.question}</AppText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.secondary} />
      </Pressable>
      {open && <AppText style={[shop.muted, styles.answer]}>{item.answer}</AppText>}
    </View>
  );
}

export default function FaqScreen() {
  const query = useQuery({ queryKey: ['faqs'], queryFn: ({ signal }) => fetchFaqs(signal) });

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
        {query.data?.length === 0 && <AppText style={shop.muted}>No FAQs are available right now.</AppText>}
        {query.data?.map(item => <FaqRow key={item.id} item={item} />)}
        {query.data && (
          <View style={styles.contactPrompt}>
            <AppText style={shop.muted}>Still have questions?</AppText>
            <Button label="Contact us" onPress={() => router.push('/contact-us')} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32, gap: 4 },
  row: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: 12 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  question: { fontFamily: theme.fonts.medium, fontSize: 15, flex: 1 },
  answer: { marginTop: 8, lineHeight: 20 },
  contactPrompt: { alignItems: 'center', gap: 10, marginTop: 20 },
});
