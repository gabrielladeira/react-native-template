
// MMKV e SecureStore são nativos: mockamos no nível do módulo para que os
// testes rodem em Node sem dev build.
jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: (key: string) => store.get(key),
      set: (key: string, value: string) => store.set(key, value),
      delete: (key: string) => store.delete(key),
      clearAll: () => store.clear(),
    })),
  };
});

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
    getItemAsync: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => Promise.resolve(void store.set(key, value))),
    deleteItemAsync: jest.fn((key: string) => Promise.resolve(void store.delete(key))),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { apiBaseUrl: 'https://api.test', wsUrl: 'wss://api.test/ws' },
    },
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});
