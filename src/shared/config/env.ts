import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Guia computacional: se a config estiver errada, o app quebra no boot com uma
 * mensagem explícita — em vez de falhar de forma difusa em runtime.
 */
const envSchema = z.object({
  apiBaseUrl: z.url(),
  wsUrl: z.string().regex(/^wss?:\/\//, 'wsUrl deve começar com ws:// ou wss://'),
  requestTimeoutMs: z.number().int().positive().default(15_000),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  ...(Constants.expoConfig?.extra ?? {}),
  requestTimeoutMs: 15_000,
});

if (!parsed.success) {
  throw new Error(
    `Configuração inválida em app.json > expo.extra:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env: Env = parsed.data;
