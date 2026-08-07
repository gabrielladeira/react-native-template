import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.email(),
  avatarUrl: z.url().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const credentialsSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
});
export type Credentials = z.infer<typeof credentialsSchema>;

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int(),
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;

/** Regra pura e testável — nada de Date.now() escondido lá dentro. */
export function isExpired(session: Pick<Session, 'expiresAt'>, now: number, skewMs = 30_000): boolean {
  return session.expiresAt - skewMs <= now;
}
