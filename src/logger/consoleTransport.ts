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

const prepareBlackList = (config: string = '') => {
  return config.split(',').filter(Boolean);
}

const blackList = prepareBlackList(process.env.LOG_BLACKLIST).map((item) => new RegExp(item));

const filterBlackList = (logObject: TLogMessage) => {
  if (blackList.length === 0) {
    return true;
  }

  for (let i = 0; i < blackList.length; i++) {
    if(blackList[i].test(logObject.moduleName)) {
      return false;
    }
  }

  return true;
}

export const consoleTransport = zerg.createListener({
  handler: (...args) => consoleNodeColorful(handler(...args)),
  filter: (logMessage => filterBlackList(logMessage))
});
