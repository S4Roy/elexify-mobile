import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const TOKEN = 'elexify.session.token';
const GUEST = 'elexify.guest.id';
export const sessionStorage = {
  readToken: () => SecureStore.getItemAsync(TOKEN),
  writeToken: (token: string) => SecureStore.setItemAsync(TOKEN, token),
  removeToken: () => SecureStore.deleteItemAsync(TOKEN),
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
