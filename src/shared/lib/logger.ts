/* eslint-disable no-console */
type Level = 'debug' | 'info' | 'warn' | 'error';

const enabled: Record<Level, boolean> = {
  debug: __DEV__,
  info: __DEV__,
  warn: true,
  error: true,
};

function emit(level: Level, scope: string, message: string, meta?: Record<string, unknown>): void {
  if (!enabled[level]) return;
  const line = `[${level.toUpperCase()}][${scope}] ${message}`;
  if (level === 'error') console.error(line, meta ?? '');
  else if (level === 'warn') console.warn(line, meta ?? '');
  else console.log(line, meta ?? '');
}

/**
 * Único ponto de log da aplicação (ESLint bloqueia console.log direto).
 * Trocar por Sentry/Datadog aqui não exige tocar em nenhum call site.
 */
export function createLogger(scope: string) {
  return {
    debug: (m: string, meta?: Record<string, unknown>) => emit('debug', scope, m, meta),
    info: (m: string, meta?: Record<string, unknown>) => emit('info', scope, m, meta),
    warn: (m: string, meta?: Record<string, unknown>) => emit('warn', scope, m, meta),
    error: (m: string, meta?: Record<string, unknown>) => emit('error', scope, m, meta),
  };
}
