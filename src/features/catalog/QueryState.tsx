import React from 'react';
import { Feedback, Skeleton } from '../../components/ui';
import { apiConfig } from '../../api/config';
export function QueryState({
  pending,
  error,
  paused,
  retry,
}: {
  pending: boolean;
  error: Error | null;
  paused?: boolean;
  retry: () => void;
}) {
  if (!apiConfig.baseUrl) {
    return (
      <Feedback
        title="The store is getting ready"
        message="Please check back soon to explore our products."
      />
    );
  }
  if (error) {
    return (
      <Feedback
        title="Unable to load"
        message={error.message}
        onRetry={retry}
      />
    );
  }
  if (pending) {
    return paused ? (
      <Feedback
        title="Waiting for connection"
        message="We’ll load the store when you’re back online."
      />
    ) : (
      <Skeleton />
    );
  }
  return null;
}
