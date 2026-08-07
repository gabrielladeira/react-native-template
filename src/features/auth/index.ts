/** API pública da feature auth. Nada fora daqui deve ser importado de fora. */
export { useSession, installAuthInterceptor } from '@/features/auth/store/session';
export { useMe, useLogin, useLogout } from '@/features/auth/api/hooks';
export { userSchema, credentialsSchema, isExpired } from '@/features/auth/model/schemas';
export type { User, Credentials, Session } from '@/features/auth/model/schemas';
