import { sleep } from '../utils';

export const errorResponse = [
  'invalid json response',
  'handle request error',
  'Invalid JSON RPC response',
  'nonce too low',
  'was not mined within 750 seconds',
  'The transaction is still not confirmed after 20 attempts',
  'replacement transaction underpriced',
  'Client network socket disconnected before secure TLS connection was established',
].map(text => text.toLowerCase());

export const rpcErrorMessage = error => {
  if (error && error.message) {
    return errorResponse.some(text => error.message.toLowerCase().includes(text));
  }

  if (typeof error === 'string') {
    return errorResponse.some(text => error.toLowerCase().includes(text));
  }

  return false;
};

export const rpcErrorHandler = (func: () => Promise<any>) => async (...args) => {
  try {
    return func.apply(this, args);
  } catch (e) {
    if (rpcErrorMessage(e)) {
      // log.error('rpcErrorHandler exception', { erc20TokenAddr, error: e });

      await sleep(10000);

      return await rpcErrorHandler(func).apply(this, args);
    } else {
      throw e;
    }
  }
};
