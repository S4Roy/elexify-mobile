import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const TOKEN = 'elexify.session.token';
const GUEST = 'elexify.guest.id';
export const sessionStorage = {
  async deviceId() {
    const key = 'elexify.device.id';
    const existing = await AsyncStorage.getItem(key);
    if (existing) return existing;
    const id = Crypto.randomUUID();
    await AsyncStorage.setItem(key, id);
    return id;
  },
  readRefresh: () => SecureStore.getItemAsync('elexify.session.refresh'),
  writeRefresh: (token: string) => SecureStore.setItemAsync('elexify.session.refresh', token),
  removeRefresh: () => SecureStore.deleteItemAsync('elexify.session.refresh'),
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
