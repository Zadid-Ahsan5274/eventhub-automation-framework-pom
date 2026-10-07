type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const write = (level: Level, scope: string, message: string): void => {
  const ts = new Date().toISOString().slice(11, 23);
  // eslint-disable-next-line no-console
  console.log(`${ts} ${level.padEnd(5)} [${scope}] ${message}`);
};

export const createLogger = (scope: string) => ({
  info: (m: string) => write('INFO', scope, m),
  warn: (m: string) => write('WARN', scope, m),
  error: (m: string) => write('ERROR', scope, m),
  debug: (m: string) => {
    if (process.env.DEBUG_LOG === 'true') write('DEBUG', scope, m);
  },
});