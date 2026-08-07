import type { ZodType } from 'zod';
import { z } from 'zod';
import { env } from '@/shared/config/env';
import { createLogger } from '@/shared/lib/logger';
import { ApiError, statusToKind } from '@/shared/api/errors';

const log = createLogger('http');

// ---------------------------------------------------------------------------
// Injeção de token sem quebrar a regra de camadas.
// src/shared/ não pode importar src/features/auth — então a feature registra
// seu provider aqui no boot.
// ---------------------------------------------------------------------------
type TokenProvider = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let getToken: TokenProvider = async () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;

export function configureAuth(options: {
  getToken: TokenProvider;
  onUnauthorized: UnauthorizedHandler;
}): void {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

// ---------------------------------------------------------------------------
// Definição de endpoint
// ---------------------------------------------------------------------------
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Endpoint<TParams, TBody, TResponse> {
  method: HttpMethod;
  /** Caminho relativo à base. Sempre derivado dos params — nunca concatenado à mão. */
  path: (params: TParams) => string;
  /** Schema Zod da resposta. Obrigatório: é o contrato com o backend. */
  response: ZodType<TResponse>;
  /** Schema do corpo, quando houver. */
  body?: ZodType<TBody>;
  /** Query string opcional. */
  query?: (params: TParams) => Record<string, string | number | boolean | undefined>;
  /** Envia Authorization: Bearer. Default: true. */
  auth?: boolean;
}

/**
 * Fábrica tipada de endpoints. Use SEMPRE isto em vez de chamar fetch direto.
 *
 * @example
 * export const getUser = defineEndpoint({
 *   method: 'GET',
 *   path: ({ id }: { id: string }) => `/users/${id}`,
 *   response: userSchema,
 * });
 */
export function defineEndpoint<TParams = void, TBody = void, TResponse = unknown>(
  endpoint: Endpoint<TParams, TBody, TResponse>,
): Endpoint<TParams, TBody, TResponse> {
  return endpoint;
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
const problemSchema = z.object({
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

function buildUrl<TParams>(
  endpoint: Endpoint<TParams, unknown, unknown>,
  params: TParams,
): string {
  const url = new URL(endpoint.path(params), env.apiBaseUrl);
  const query = endpoint.query?.(params);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export interface CallOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function call<TParams, TBody, TResponse>(
  endpoint: Endpoint<TParams, TBody, TResponse>,
  args: { params: TParams; body?: TBody },
  options: CallOptions = {},
): Promise<TResponse> {
  const url = buildUrl(endpoint as Endpoint<TParams, unknown, unknown>, args.params);
  const timeoutMs = options.timeoutMs ?? env.requestTimeoutMs;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (endpoint.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let payload: string | undefined;
  if (args.body !== undefined) {
    // Valida o que ENVIAMOS também: erro de request vira falha local, não 400 remoto.
    const parsedBody = endpoint.body ? endpoint.body.parse(args.body) : args.body;
    payload = JSON.stringify(parsedBody);
    headers['Content-Type'] = 'application/json';
  }

  // Compomos os sinais na mão: AbortSignal.any não está garantido no Hermes.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const abortFromCaller = (): void => timeoutController.abort();
  options.signal?.addEventListener('abort', abortFromCaller);
  const signal = timeoutController.signal;

  let response: Response;
  try {
    response = await fetch(url, {
      method: endpoint.method,
      headers,
      ...(payload === undefined ? {} : { body: payload }),
      signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (timeoutController.signal.aborted) {
      throw new ApiError('timeout', `Timeout de ${timeoutMs}ms em ${endpoint.method} ${url}`);
    }
    throw new ApiError('network', `Falha de rede em ${endpoint.method} ${url}`, undefined, error);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }

  if (!response.ok) {
    const kind = statusToKind(response.status);
    if (kind === 'unauthorized') onUnauthorized();

    const problem = problemSchema.safeParse(await safeJson(response));
    throw new ApiError(
      kind,
      problem.success && problem.data.message
        ? problem.data.message
        : `${endpoint.method} ${url} respondeu ${response.status}`,
      response.status,
      problem.success ? problem.data.errors : undefined,
    );
  }

  if (response.status === 204) {
    return endpoint.response.parse(undefined);
  }

  const raw = await safeJson(response);
  const parsed = endpoint.response.safeParse(raw);

  if (!parsed.success) {
    // Quebra de contrato: o backend mudou ou o schema está errado.
    // Falhamos alto de propósito — dado inválido não entra na aplicação.
    log.error('Resposta fora do contrato', { url, issues: z.prettifyError(parsed.error) });
    throw new ApiError(
      'contract',
      `Resposta de ${endpoint.method} ${url} não bate com o schema:\n${z.prettifyError(parsed.error)}`,
      response.status,
      parsed.error.issues,
    );
  }

  return parsed.data;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
