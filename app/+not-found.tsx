import React from 'react';
import { router } from 'expo-router';
import { Button, Feedback, Screen } from '../src/components/ui';
export default function NotFound() {
  return (
    <Screen title="Page unavailable">
      <Feedback
        title="We couldn’t find that page"
        message="Head back to the store to keep exploring."
      />
      <Button label="Back to home" onPress={() => router.replace('/')} />
    </Screen>
  );
}
