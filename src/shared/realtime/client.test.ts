import { backoffDelay } from '@/shared/realtime/client';

describe('backoffDelay', () => {
  afterEach(() => jest.restoreAllMocks());

  it('cresce exponencialmente até o teto', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    expect(backoffDelay(0, 30_000)).toBe(500);
    expect(backoffDelay(1, 30_000)).toBe(1000);
    expect(backoffDelay(3, 30_000)).toBe(4000);
    expect(backoffDelay(10, 30_000)).toBe(30_000);
  });

  it('aplica jitter total (nunca acima do valor exponencial)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(backoffDelay(5, 30_000)).toBe(0);
  });
});
