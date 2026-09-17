import React from 'react';
import { Feedback, Skeleton } from '../../components/ui';
import { apiConfig } from '../../api/config';
export function QueryState({
  pending,
  error,
  paused,
  retry,
  skeleton,
}: {
  pending: boolean;
  error: Error | null;
  paused?: boolean;
  retry: () => void;
  /** Custom placeholder shown while pending (e.g. a grid-shaped skeleton). Defaults to the generic bar Skeleton. */
  skeleton?: React.ReactNode;
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
    if (paused) {
      return (
        <Feedback
          title="Waiting for connection"
          message="We’ll load the store when you’re back online."
        />
      );
    }
    return <>{skeleton ?? <Skeleton />}</>;
  }
  return null;
}
