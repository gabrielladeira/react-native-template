import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { call } from '@/shared/api/http';
import { queryKeys } from '@/shared/query/keys';
import { useSession } from '@/features/auth/store/session';
import type { Credentials } from '@/features/auth/model/schemas';
import * as endpoints from '@/features/auth/api/endpoints';

export function useMe() {
  const status = useSession((s) => s.status);
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: ({ signal }) => call(endpoints.me, { params: undefined }, { signal }),
    enabled: status === 'authenticated',
  });
}

export function useLogin() {
  const setSession = useSession((s) => s.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) =>
      call(endpoints.login, { params: undefined, body: credentials }),
    onSuccess: async (session) => {
      await setSession(session);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

export function useLogout() {
  const signOut = useSession((s) => s.signOut);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => call(endpoints.logout, { params: undefined }),
    onSettled: async () => {
      await signOut();
      queryClient.clear();
    },
  });
}
