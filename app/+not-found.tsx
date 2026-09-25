import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { EmptyState } from '../src/components/EmptyState';
import { ShopHeader, shop } from '../src/components/shop';

// Unknown routes, and web links the app can't map to a screen.
export default function NotFound() {
  const canGoBack = router.canGoBack();
  return (
    <View style={shop.page}>
      <ShopHeader title="Page not found" back={canGoBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <EmptyState
          icon="compass-outline"
          tone="amber"
          title="We couldn't find that page"
          text="The link may be broken or the page may have moved. Try searching, or keep browsing from the home page."
          primary={{ label: 'Go to home', icon: 'home-outline', onPress: () => router.replace('/') }}
          secondary={[
            { label: 'Search', icon: 'search-outline', onPress: () => router.replace('/search') },
            { label: 'Categories', icon: 'apps-outline', onPress: () => router.replace('/categories') },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, justifyContent: 'center', padding: 20 },
});
