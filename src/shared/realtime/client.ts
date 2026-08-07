import { z } from 'zod';
import type { ZodType } from 'zod';
import { env } from '@/shared/config/env';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('realtime');

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

/** Envelope acordado com o backend: todo evento tem `type` e `payload`. */
const envelopeSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
});

export interface RealtimeOptions {
  url?: string;
  /** Token enviado no handshake. Resolvido a cada tentativa (pode ter expirado). */
  getToken?: () => Promise<string | null>;
  maxBackoffMs?: number;
  heartbeatMs?: number;
}

type Listener = (payload: unknown) => void;
type StateListener = (state: ConnectionState) => void;

/**
 * Cliente WebSocket com reconexão exponencial + jitter, heartbeat e
 * validação de payload por Zod.
 *
 * Se o backend for socket.io, troque a implementação AQUI — a interface
 * pública (`subscribe`, `send`, `onStateChange`) não muda. Veja docs/adr/0004.
 */
export class RealtimeClient {
  private socket: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private intentionallyClosed = false;

  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly stateListeners = new Set<StateListener>();
  private readonly options: Required<Omit<RealtimeOptions, 'getToken'>> &
    Pick<RealtimeOptions, 'getToken'>;

  constructor(options: RealtimeOptions = {}) {
    this.options = {
      url: options.url ?? env.wsUrl,
      maxBackoffMs: options.maxBackoffMs ?? 30_000,
      heartbeatMs: options.heartbeatMs ?? 25_000,
      ...(options.getToken ? { getToken: options.getToken } : {}),
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  connect(): void {
    if (this.state === 'open' || this.state === 'connecting') return;
    this.intentionallyClosed = false;
    void this.openSocket();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.clearTimers();
    this.socket?.close(1000, 'client disconnect');
    this.socket = null;
    this.setState('closed');
  }

  /** Assina um tipo de evento; o payload é validado antes de chegar ao handler. */
  subscribe<T>(type: string, schema: ZodType<T>, handler: (payload: T) => void): () => void {
    const listener: Listener = (raw) => {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        log.error(`Evento "${type}" fora do contrato`, { issues: z.prettifyError(parsed.error) });
        return;
      }
      handler(parsed.data);
    };

    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);

    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(type);
    };
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  send(type: string, payload: unknown): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      log.warn(`send("${type}") ignorado: socket não está aberto`, { state: this.state });
      return false;
    }
    this.socket.send(JSON.stringify({ type, payload }));
    return true;
  }

  // -------------------------------------------------------------------------

  private async openSocket(): Promise<void> {
    this.setState(this.attempt === 0 ? 'connecting' : 'reconnecting');

    const token = (await this.options.getToken?.()) ?? null;
    const url = token
      ? `${this.options.url}?token=${encodeURIComponent(token)}`
      : this.options.url;

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setState('open');
      this.startHeartbeat();
      log.info('Conectado');
    };

    // Tipos mínimos: os globais WebSocketMessageEvent/CloseEvent do RN não são
    // estáveis entre versões, então declaramos só o que usamos.
    socket.onmessage = (event: { data: unknown }) => {
      this.dispatch(event.data);
    };

    socket.onerror = () => {
      log.warn('Erro no socket');
    };

    socket.onclose = (event: { code?: number }) => {
      this.clearTimers();
      this.socket = null;
      if (this.intentionallyClosed) {
        this.setState('closed');
        return;
      }
      log.warn('Conexão caiu, agendando reconexão', { code: event.code });
      this.scheduleReconnect();
    };
  }

  private dispatch(data: unknown): void {
    if (typeof data !== 'string') return;
    let raw: unknown;
    try {
      raw = JSON.parse(data);
    } catch {
      log.error('Mensagem não é JSON válido');
      return;
    }

    const envelope = envelopeSchema.safeParse(raw);
    if (!envelope.success) {
      log.error('Envelope inválido: esperado { type, payload }');
      return;
    }
    if (envelope.data.type === 'pong') return;

    const listeners = this.listeners.get(envelope.data.type);
    if (!listeners || listeners.size === 0) return;
    for (const listener of listeners) listener(envelope.data.payload);
  }

  private scheduleReconnect(): void {
    this.setState('reconnecting');
    const delay = backoffDelay(this.attempt, this.options.maxBackoffMs);
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => void this.openSocket(), delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', null);
    }, this.options.heartbeatMs);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }
}

/** Backoff exponencial com jitter total. Exportado para poder ser testado. */
export function backoffDelay(attempt: number, maxMs: number, baseMs = 500): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** attempt);
  return Math.round(Math.random() * exponential);
}

export const realtime = new RealtimeClient();
