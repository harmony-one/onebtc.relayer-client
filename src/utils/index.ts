import { randomBytes } from '@harmony-js/crypto/dist/random';

type TExtendError = Error & { status?: number };

export const createError = (status: number, message: string): TExtendError => {
  const error: TExtendError = new Error(message);
  error.status = status;

  return error;
};

export const sleep = ms => new Promise(res => setTimeout(res, ms));

export const clear = (obj: any) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key]) acc[key] = obj[key];
    return acc;
  }, {});
};

export const uuidv4 = () => {
  return [randomBytes(4), randomBytes(4), randomBytes(4), randomBytes(4)].join('-');
};

export const bn = b => BigInt(`0x${b.toString('hex')}`);
