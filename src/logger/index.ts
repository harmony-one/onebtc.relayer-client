import zerg from 'zerg';
import { consoleTransport } from './consoleTransport';
import { sentryTransport } from './sentryTransport';

const logger = zerg.createLogger();

const SENTRY_DSN_TOKEN = process.env.SENTRY_DSN_TOKEN_N || process.env.SENTRY_DSN_TOKEN;

const transport = SENTRY_DSN_TOKEN ? sentryTransport : consoleTransport;
console.log('Logger uses ', SENTRY_DSN_TOKEN ? 'sentry' : 'console');
logger.addListener(transport);

export default logger;
