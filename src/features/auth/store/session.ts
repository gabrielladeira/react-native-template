import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandKvStorage } from '@/shared/storage/kv';
import { getSecure, setSecure, clearSecure } from '@/shared/storage/secure';
import { configureAuth, call } from '@/shared/api/http';
import { createLogger } from '@/shared/lib/logger';
import { isExpired } from '@/features/auth/model/schemas';
import type { Session, User } from '@/features/auth/model/schemas';
import * as endpoints from '@/features/auth/api/endpoints';

const log = createLogger('session');

interface SessionState {
  user: User | null;
  expiresAt: number | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  setSession: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
}

/**
 * Estado de sessão. Tokens NÃO ficam aqui — vivem no SecureStore.
 * O store guarda só o que a UI precisa ler de forma síncrona.
 */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      expiresAt: null,
      status: 'unknown',

      async setSession(session) {
        await setSecure('accessToken', session.accessToken);
        await setSecure('refreshToken', session.refreshToken);
        set({ user: session.user, expiresAt: session.expiresAt, status: 'authenticated' });
      },

      async signOut() {
        await clearSecure();
        set({ user: null, expiresAt: null, status: 'anonymous' });
      },

      async hydrate() {
        const token = await getSecure('accessToken');
        set({ status: token ? 'authenticated' : 'anonymous' });
      },
    }),
    {
      name: 'session',
      storage: createJSONStorage(() => zustandKvStorage),
      partialize: (state) => ({ user: state.user, expiresAt: state.expiresAt }),
    },
  ),
);

/**
 * Conecta a camada HTTP à sessão sem violar as regras de camada
 * (shared/ nunca importa features/). Chamar uma vez no root layout.
 */
export function installAuthInterceptor(): void {
  configureAuth({
    async getToken() {
      const { expiresAt } = useSession.getState();
      const accessToken = await getSecure('accessToken');
      if (!accessToken) return null;
      if (expiresAt !== null && isExpired({ expiresAt }, Date.now())) {
        return refreshAccessToken();
      }
      return accessToken;
    },
    onUnauthorized() {
      log.warn('401 recebido — encerrando sessão');
      void useSession.getState().signOut();
    },
  });
}

let refreshInFlight: Promise<string | null> | null = null;

/** Deduplica refresh concorrente: N requisições expiradas -> 1 refresh. */
async function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await getSecure('refreshToken');
      if (!refreshToken) return null;
      const session = await call(endpoints.refresh, {
        params: undefined,
        body: { refreshToken },
      });
      await useSession.getState().setSession(session);
      return session.accessToken;
    } catch (error) {
      log.error('Refresh falhou', { error });
      await useSession.getState().signOut();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
