import { useEffect } from 'react';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useAccount } from '../auth/hooks';
import { isEnglishCustomerName } from '../../utils/customer-name';

export function CustomerNameGate() {
  const account = useAccount();
  const pathname = usePathname();
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (navigation?.key && account.data &&
        !isEnglishCustomerName([account.data.firstName, account.data.lastName].filter(Boolean).join(' ')) &&
        pathname !== '/account/profile') {
      router.replace('/account/profile');
    }
  }, [navigation?.key, account.data, pathname]);
  return null;
}
