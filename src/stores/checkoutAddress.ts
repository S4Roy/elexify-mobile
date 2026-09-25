import { create } from 'zustand';

// Hand-off from the address form back to checkout: the form records which
// address was just added/edited, and checkout selects it on return. In-memory
// only — it's consumed as soon as checkout sees the address in its list.
type CheckoutAddressState = {
  pendingId: string | null;
  select: (id: string) => void;
  consume: () => void;
};

export const useCheckoutAddress = create<CheckoutAddressState>(set => ({
  pendingId: null,
  select: id => set({ pendingId: id }),
  consume: () => set({ pendingId: null }),
}));
