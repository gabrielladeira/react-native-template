import { mergeMessages, messageSchema } from '@/features/chat/model/schemas';
import type { Message } from '@/features/chat/model/schemas';

const make = (id: string, sentAt: string): Message => ({
  id,
  roomId: 'r1',
  authorId: 'u1',
  body: `msg ${id}`,
  sentAt,
});

describe('mergeMessages', () => {
  it('deduplica por id mantendo a versão mais recente', () => {
    const current = [make('a', '2026-01-01T10:00:00.000Z')];
    const incoming = [{ ...make('a', '2026-01-01T10:00:00.000Z'), body: 'editada' }];

    expect(mergeMessages(current, incoming)).toEqual([expect.objectContaining({ body: 'editada' })]);
  });

  it('ordena por sentAt ascendente', () => {
    const result = mergeMessages(
      [make('b', '2026-01-01T12:00:00.000Z')],
      [make('a', '2026-01-01T09:00:00.000Z')],
    );
    expect(result.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('é idempotente', () => {
    const list = [make('a', '2026-01-01T10:00:00.000Z')];
    expect(mergeMessages(mergeMessages(list, list), list)).toHaveLength(1);
  });
});

describe('messageSchema', () => {
  it('rejeita sentAt fora do formato ISO', () => {
    expect(messageSchema.safeParse({ ...make('a', 'ontem') }).success).toBe(false);
  });
});
