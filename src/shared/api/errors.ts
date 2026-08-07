/**
 * Taxonomia fechada de erros. A UI faz switch exaustivo sobre `kind`
 * (o ESLint garante exaustividade via switch-exhaustiveness-check).
 */
export type ApiErrorKind =
  | 'network'      // sem conexão / DNS / TLS
  | 'timeout'      // estourou o deadline
  | 'unauthorized' // 401 — sessão inválida
  | 'forbidden'    // 403 — sem permissão
  | 'notFound'     // 404
  | 'validation'   // 422 / erro de campo vindo do servidor
  | 'contract'     // resposta 2xx que NÃO bate com o schema Zod
  | 'server'       // 5xx
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly details: unknown;

  constructor(kind: ApiErrorKind, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }

  /** Erros de contrato e 5xx são bugs nossos/do backend: nunca silenciar. */
  get isBug(): boolean {
    return this.kind === 'contract' || this.kind === 'server';
  }

  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

export function statusToKind(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}
