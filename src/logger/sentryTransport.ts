import * as Sentry from '@sentry/node';
import zerg from 'zerg';

const SENTRY_LEVEL_MAP = {
  info: 'info',
  warn: 'warning',
  error: 'error',
  fatal: 'error',
};

if (process.env.SENTRY_DSN_TOKEN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN_TOKEN });
}

const sentryHandler = logMessage => {
  const level = SENTRY_LEVEL_MAP[logMessage.level];

  Sentry.withScope(scope => {
    scope.setLevel(level);

    logMessage.extendedData = logMessage.extendedData || {};
    Object.keys(logMessage.extendedData).forEach(key => {
      scope.setExtra(key, logMessage.extendedData[key]);
    });

    scope.setTag('module', logMessage.moduleName);

    Sentry.captureMessage(logMessage.message);
  });
};

export const sentryTransport = zerg.createListener({ handler: sentryHandler });
