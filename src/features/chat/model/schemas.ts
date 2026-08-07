import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  authorId: z.string(),
  body: z.string(),
  sentAt: z.iso.datetime(),
});
export type Message = z.infer<typeof messageSchema>;

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});
export type MessagePage = z.infer<typeof messagePageSchema>;

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  unreadCount: z.number().int().nonnegative(),
});
export type Room = z.infer<typeof roomSchema>;

/** Evento vindo do socket — schema separado do REST de propósito. */
export const messageCreatedEvent = messageSchema;

/** Merge determinístico: dedupe por id, ordenado por sentAt asc. Puro e testável. */
export function mergeMessages(current: readonly Message[], incoming: readonly Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const message of [...current, ...incoming]) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
}
