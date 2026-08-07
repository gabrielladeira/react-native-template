/* eslint-disable no-restricted-imports */
import * as SecureStore from 'expo-secure-store';

/**
 * Keychain (iOS) / Keystore (Android). Somente segredos: tokens, refresh tokens,
 * chaves. Tudo aqui é assíncrono e não deve ser lido em render.
 */
const SECURE_KEYS = ['accessToken', 'refreshToken'] as const;
export type SecureKey = (typeof SECURE_KEYS)[number];

export async function getSecure(key: SecureKey): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setSecure(key: SecureKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function removeSecure(key: SecureKey): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function clearSecure(): Promise<void> {
  await Promise.all(SECURE_KEYS.map(removeSecure));
}
