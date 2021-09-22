import zerg from 'zerg';
import { consoleTransport } from './consoleTransport';
import { sentryTransport } from './sentryTransport';

const logger = zerg.createLogger();

const transport = process.env.SENTRY_DSN_TOKEN ? sentryTransport : consoleTransport;
console.log('Logger uses ', process.env.SENTRY_DSN_TOKEN ? 'sentry' : 'console');
logger.addListener(transport);

export default logger;
