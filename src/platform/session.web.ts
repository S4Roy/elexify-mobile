// Browser preview uses an ephemeral token; native credentials always use SecureStore.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
let token: string | null = null;
const GUEST = 'elexify.guest.id';
export const sessionStorage = {
  readToken: async () => token,
  writeToken: async (value: string) => {
    token = value;
  },
  removeToken: async () => {
    token = null;
  },
  async guestId() {
    const existing = await AsyncStorage.getItem(GUEST);
    if (existing) {
      return existing;
    }
    const id = Crypto.randomUUID();
    await AsyncStorage.setItem(GUEST, id);
    return id;
  },
  async resetGuest() {
    const id = Crypto.randomUUID();
    await AsyncStorage.setItem(GUEST, id);
    return id;
  },
};
