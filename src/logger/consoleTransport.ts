import zerg from 'zerg';
import { TLogMessage } from 'zerg/dist/types';
import { getExtendedData } from './utils';
import { consoleNodeColorful } from 'zerg/dist/transports';

function handler(logMessage: TLogMessage) {
  const date = new Date().toISOString();
  const message = `${logMessage.message}`;

  const args: any[] = [message];
  const extendedData = getExtendedData(logMessage);

  if (extendedData) {
    args.push(extendedData);
  }

  logMessage.message = args.join(' ');
  return logMessage;
}

export const consoleTransport = zerg.createListener({
  handler: (...args) => consoleNodeColorful(handler(...args)),
});
