import { z } from 'zod';
import { defineEndpoint } from '@/shared/api/http';
import { messagePageSchema, messageSchema, roomSchema } from '@/features/chat/model/schemas';

export const listRooms = defineEndpoint({
  method: 'GET',
  path: () => '/rooms',
  response: z.array(roomSchema),
});

export const listMessages = defineEndpoint({
  method: 'GET',
  path: ({ roomId }: { roomId: string; cursor?: string }) => `/rooms/${roomId}/messages`,
  query: ({ cursor }) => ({ cursor, limit: 50 }),
  response: messagePageSchema,
});

export const sendMessage = defineEndpoint({
  method: 'POST',
  path: ({ roomId }: { roomId: string }) => `/rooms/${roomId}/messages`,
  body: z.object({ body: z.string().min(1).max(4000), clientId: z.string() }),
  response: messageSchema,
});
