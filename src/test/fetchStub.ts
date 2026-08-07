/**
 * Stub determinístico de fetch para testes de contrato da camada HTTP.
 * Mais barato e previsível que subir um servidor; para testes de componente
 * com muitas rotas, considere MSW.
 */
export interface StubbedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

export function stubFetch(
  responder: (call: StubbedCall) => { status: number; json?: unknown } | Promise<never>,
): { calls: StubbedCall[]; restore: () => void } {
  const calls: StubbedCall[] = [];
  const original = global.fetch;

  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: StubbedCall = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: (init?.headers as Record<string, string>) ?? {},
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);

    const result = await responder(call);
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      json: async () => result.json,
    } as Response;
  }) as unknown as typeof fetch;

  return { calls, restore: () => void (global.fetch = original) };
}
