import { z } from 'zod';
import { defineEndpoint } from '@/shared/api/http';
import { credentialsSchema, sessionSchema, userSchema } from '@/features/auth/model/schemas';

export const login = defineEndpoint({
  method: 'POST',
  path: () => '/auth/login',
  body: credentialsSchema,
  response: sessionSchema,
  auth: false,
});

export const refresh = defineEndpoint({
  method: 'POST',
  path: () => '/auth/refresh',
  body: z.object({ refreshToken: z.string() }),
  response: sessionSchema,
  auth: false,
});

export const me = defineEndpoint({
  method: 'GET',
  path: () => '/auth/me',
  response: userSchema,
});

export const logout = defineEndpoint({
  method: 'POST',
  path: () => '/auth/logout',
  response: z.undefined(),
});
