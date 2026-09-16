import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiConfig } from '../../api/config';
import {
  AddressInput,
  deleteAddress,
  fetchAddresses,
  lookupPincode,
  saveAddress,
  setDefaultAddress,
} from '../../api/address';
import { useSession } from '../../stores/session';
import { useIdentity } from '../catalog/hooks';

export function useAddresses() {
  const identity = useIdentity();
  const isAuthenticated = useSession(s => s.status === 'authenticated');
  return useQuery({
    queryKey: ['addresses', identity],
    queryFn: ({ signal }) => fetchAddresses(1, signal),
    enabled: !!apiConfig.baseUrl && isAuthenticated,
  });
}

export function useSaveAddress() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => saveAddress(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', identity] }).catch(() => undefined);
    },
  });
}

export function useSetDefaultAddress() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', identity] }).catch(() => undefined);
    },
  });
}

export function useDeleteAddress() {
  const identity = useIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', identity] }).catch(() => undefined);
    },
  });
}

export function useLookupPincode() {
  return useMutation({
    mutationFn: (postcode: string) => lookupPincode(postcode),
  });
}
