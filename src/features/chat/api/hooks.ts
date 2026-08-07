import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { call } from '@/shared/api/http';
import { queryKeys } from '@/shared/query/keys';
import { useRealtimeEvent } from '@/shared/realtime/useRealtimeEvent';
import { messageCreatedEvent, mergeMessages } from '@/features/chat/model/schemas';
import type { Message, MessagePage } from '@/features/chat/model/schemas';
import * as endpoints from '@/features/chat/api/endpoints';

export function useRooms() {
  return useQuery({
    queryKey: queryKeys.chat.rooms(),
    queryFn: ({ signal }) => call(endpoints.listRooms, { params: undefined }, { signal }),
  });
}

export function useMessages(roomId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(roomId),
    queryFn: ({ pageParam, signal }) =>
      call(
        endpoints.listMessages,
        { params: { roomId, ...(pageParam ? { cursor: pageParam } : {}) } },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: MessagePage) => lastPage.nextCursor ?? undefined,
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) =>
      call(endpoints.sendMessage, {
        params: { roomId },
        body: { body, clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      }),
    onSuccess: (message) => {
      appendToCache(queryClient, roomId, message);
    },
  });
}

/** Costura socket -> cache do React Query. Sem estado paralelo. */
export function useLiveMessages(roomId: string): void {
  const queryClient = useQueryClient();

  const onMessage = useCallback(
    (message: Message) => {
      if (message.roomId !== roomId) return;
      appendToCache(queryClient, roomId, message);
    },
    [queryClient, roomId],
  );

  useRealtimeEvent('message.created', messageCreatedEvent, onMessage);
}

function appendToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  roomId: string,
  message: Message,
): void {
  queryClient.setQueryData<{ pages: MessagePage[]; pageParams: unknown[] }>(
    queryKeys.chat.messages(roomId),
    (cached) => {
      if (!cached) return cached;
      const [first, ...rest] = cached.pages;
      if (!first) return cached;
      return {
        ...cached,
        pages: [{ ...first, items: mergeMessages(first.items, [message]) }, ...rest],
      };
    },
  );
}
