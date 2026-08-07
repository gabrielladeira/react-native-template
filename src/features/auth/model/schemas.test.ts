import { isExpired, credentialsSchema } from '@/features/auth/model/schemas';

describe('isExpired', () => {
  const now = 1_700_000_000_000;

  it('considera expirado dentro da janela de skew', () => {
    expect(isExpired({ expiresAt: now + 10_000 }, now, 30_000)).toBe(true);
  });

  it('considera válido fora da janela de skew', () => {
    expect(isExpired({ expiresAt: now + 60_000 }, now, 30_000)).toBe(false);
  });
});

describe('credentialsSchema', () => {
  it('exige senha de 8+ caracteres', () => {
    const result = credentialsSchema.safeParse({ email: 'a@b.com', password: 'curta' });
    expect(result.success).toBe(false);
  });
});
