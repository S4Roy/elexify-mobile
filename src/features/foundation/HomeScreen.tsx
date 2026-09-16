import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  AppText,
  Button,
  Card,
  Feedback,
  Screen,
  Skeleton,
  styles,
} from '../../components/ui';
import { apiConfig } from '../../api/config';
import { getCatalogPreview } from '../../api/catalog';
import { useSession } from '../../stores/session';
export default function HomeScreen() {
  const identity = useSession(
    state => state.status + ':' + (state.guestId ?? ''),
  );
  const products = useQuery({
    queryKey: ['catalog-preview', identity],
    queryFn: ({ signal }) => getCatalogPreview(signal),
    enabled: !!apiConfig.baseUrl,
  });
  return (
    <Screen
      title="Elexify"
      subtitle="Discover something for your next project."
    >
      <Card>
        <AppText style={styles.heading}>Welcome to Elexify</AppText>
        <AppText>Explore products and inspiration, all in one place.</AppText>
        <Button
          label="Explore categories"
          onPress={() => router.push('/categories')}
        />
      </Card>
      {!apiConfig.baseUrl ? (
        <Feedback
          title="The store is getting ready"
          message="Please check back soon to explore our products."
        />
      ) : products.isPending ? (
        products.fetchStatus === 'paused' ? (
          <Feedback
            title="Waiting for connection"
            message="Products will load when you’re back online."
          />
        ) : (
          <Skeleton />
        )
      ) : products.isError ? (
        <Feedback
          title="Unable to load products"
          message={products.error.message}
          onRetry={() => {
            products.refetch().catch(() => undefined);
          }}
        />
      ) : products.data.length === 0 ? (
        <Feedback
          title="No products yet"
          message="Check back soon for new arrivals."
        />
      ) : (
        <Card>
          <AppText style={styles.heading}>Discover our products</AppText>
          {products.data.map(product => (
            <AppText key={product.id}>{product.name}</AppText>
          ))}
        </Card>
      )}
    </Screen>
  );
}
