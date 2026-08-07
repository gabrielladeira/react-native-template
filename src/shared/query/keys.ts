/**
 * Fonte única de query keys. Toda key nova entra aqui — isso torna invalidação
 * e prefetch previsíveis e evita strings soltas espalhadas pelo código.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  chat: {
    all: ['chat'] as const,
    rooms: () => [...queryKeys.chat.all, 'rooms'] as const,
    messages: (roomId: string) => [...queryKeys.chat.all, 'messages', roomId] as const,
  },
} as const;
