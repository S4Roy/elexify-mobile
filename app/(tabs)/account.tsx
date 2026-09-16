import React from 'react';
import { router } from 'expo-router';
import { AppText, Button, Feedback, Loading, Screen } from '../../src/components/ui';
import { useAccount } from '../../src/features/auth/hooks';
import { useSession } from '../../src/stores/session';

export default function Account() {
  const status = useSession(s => s.status);
  const signOut = useSession(s => s.signOut);
  const account = useAccount();

  if (status === 'loading') {
    return (
      <Screen title="Your account">
        <Loading />
      </Screen>
    );
  }
  if (status === 'error') {
    return (
      <Screen title="Your account">
        <Feedback
          title="Unable to load your session"
          message="Please try again."
          onRetry={() => {
            useSession
              .getState()
              .initialize()
              .catch(() => undefined);
          }}
        />
      </Screen>
    );
  }
  if (status !== 'authenticated') {
    return (
      <Screen title="Your account">
        <Feedback
          title="Sign in to Elexify"
          message="Sign in with your mobile number to track orders, save addresses and write reviews."
        />
        <Button label="Sign in" onPress={() => router.push('/login')} />
        <Button label="View wishlist" onPress={() => router.push('/wishlist')} />
      </Screen>
    );
  }
  const name = [account.data?.firstName, account.data?.lastName]
    .filter(Boolean)
    .join(' ');
  return (
    <Screen title="Your account">
      {account.isPending && <Loading />}
      {!!name && <AppText>{name}</AppText>}
      {!!account.data?.mobile && <AppText>+91 {account.data.mobile}</AppText>}
      <Button label="Your orders" onPress={() => router.push('/orders')} />
      <Button label="View wishlist" onPress={() => router.push('/wishlist')} />
      <Button label="Manage addresses" onPress={() => router.push('/addresses')} />
      <Feedback
        title="More on the way"
        message="Preferences will be available here soon."
      />
      <Button
        label="Sign out"
        onPress={() => {
          signOut().catch(() => undefined);
        }}
      />
    </Screen>
  );
}
