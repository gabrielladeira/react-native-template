/* eslint-disable no-restricted-imports */
import { MMKV } from 'react-native-mmkv';
import type { ZodType } from 'zod';

/**
 * Chave-valor síncrono (MMKV). Uso: preferências, flags, cache leve,
 * persistência do Zustand. NÃO use para segredos — veja @/shared/storage/secure.
 */
const storage = new MMKV({ id: 'app-kv' });

/** Namespace tipado: cada consumidor declara chave + schema uma única vez. */
export function createKvSlot<T>(key: string, schema: ZodType<T>) {
  return {
    get(): T | null {
      const raw = storage.getString(key);
      if (raw === undefined) return null;
      try {
        const parsed = schema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    set(value: T): void {
      storage.set(key, JSON.stringify(schema.parse(value)));
    },
    remove(): void {
      storage.delete(key);
    },
  };
}

/** Adapter no formato que o Zustand `persist` espera. */
export const zustandKvStorage = {
  getItem: (name: string): string | null => storage.getString(name) ?? null,
  setItem: (name: string, value: string): void => storage.set(name, value),
  removeItem: (name: string): void => storage.delete(name),
};

export function clearKv(): void {
  storage.clearAll();
}
