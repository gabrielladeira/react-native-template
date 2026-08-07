import { useEffect, useState } from 'react';
import type { ZodType } from 'zod';
import { realtime } from '@/shared/realtime/client';
import type { ConnectionState } from '@/shared/realtime/client';

/**
 * Assina um evento de socket pelo tempo de vida do componente.
 * O handler é lido de uma ref implícita via deps — passe uma função estável
 * (useCallback) ou aceite re-assinatura a cada render.
 */
export function useRealtimeEvent<T>(
  type: string,
  schema: ZodType<T>,
  handler: (payload: T) => void,
): void {
  useEffect(() => {
    return realtime.subscribe(type, schema, handler);
  }, [type, schema, handler]);
}

export function useRealtimeState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(() => realtime.getState());
  useEffect(() => realtime.onStateChange(setState), []);
  return state;
}
