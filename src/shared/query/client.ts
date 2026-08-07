import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { ApiError } from '@/shared/api/errors';

/**
 * Defaults de servidor-estado para mobile.
 * Nunca crie um QueryClient novo em componente — importe este.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) return error.isRetryable && failureCount < 3;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      // Em mobile o "focus" é o app voltar do background, não a aba do browser.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

/** Liga o focusManager ao ciclo de vida do app. Chamar uma vez, no root layout. */
export function wireAppStateToQuery(): () => void {
  const onChange = (status: AppStateStatus): void => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  };
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}
