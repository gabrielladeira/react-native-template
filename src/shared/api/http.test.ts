import { z } from 'zod';
import { call, defineEndpoint, configureAuth } from '@/shared/api/http';
import { ApiError } from '@/shared/api/errors';
import { stubFetch } from '@/test/fetchStub';

const thing = defineEndpoint({
  method: 'GET',
  path: ({ id }: { id: string }) => `/things/${id}`,
  response: z.object({ id: z.string(), n: z.number() }),
});

describe('camada HTTP', () => {
  let restore: () => void = () => undefined;
  afterEach(() => restore());

  it('monta a URL a partir de path e query', async () => {
    const endpoint = defineEndpoint({
      method: 'GET',
      path: ({ id }: { id: string; q: string }) => `/things/${id}`,
      query: ({ q }) => ({ q, limit: 10 }),
      response: z.object({ ok: z.boolean() }),
    });

    const stub = stubFetch(() => ({ status: 200, json: { ok: true } }));
    restore = stub.restore;

    await call(endpoint, { params: { id: '42', q: 'abc' } });

    expect(stub.calls[0]?.url).toBe('https://api.test/things/42?q=abc&limit=10');
  });

  it('rejeita resposta 2xx que viola o schema (quebra de contrato)', async () => {
    const stub = stubFetch(() => ({ status: 200, json: { id: '1', n: 'não é número' } }));
    restore = stub.restore;

    await expect(call(thing, { params: { id: '1' } })).rejects.toMatchObject({
      kind: 'contract',
    });
  });

  it('mapeia status HTTP para kinds da taxonomia', async () => {
    const cases: [number, string][] = [
      [401, 'unauthorized'],
      [403, 'forbidden'],
      [404, 'notFound'],
      [422, 'validation'],
      [500, 'server'],
    ];

    for (const [status, kind] of cases) {
      const stub = stubFetch(() => ({ status, json: { message: 'erro' } }));
      await expect(call(thing, { params: { id: '1' } })).rejects.toMatchObject({ kind });
      stub.restore();
    }
  });

  it('anexa o Bearer token quando auth não está desligado', async () => {
    configureAuth({ getToken: async () => 'tok-123', onUnauthorized: () => undefined });
    const stub = stubFetch(() => ({ status: 200, json: { id: '1', n: 1 } }));
    restore = stub.restore;

    await call(thing, { params: { id: '1' } });

    expect(stub.calls[0]?.headers.Authorization).toBe('Bearer tok-123');
  });

  it('dispara onUnauthorized em 401', async () => {
    const onUnauthorized = jest.fn();
    configureAuth({ getToken: async () => null, onUnauthorized });
    const stub = stubFetch(() => ({ status: 401, json: {} }));
    restore = stub.restore;

    await expect(call(thing, { params: { id: '1' } })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('classifica falha de rede como kind "network"', async () => {
    const stub = stubFetch(() => Promise.reject(new Error('boom')));
    restore = stub.restore;

    await expect(call(thing, { params: { id: '1' } })).rejects.toMatchObject({ kind: 'network' });
  });
});
