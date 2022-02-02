import { Buffer } from 'buffer';

const bitcoin = require('bitcoinjs-lib');

export const getBech32FromHex = (addressHex: string) => {
  return bitcoin.address.toBech32(
    Buffer.from(addressHex.slice(2), 'hex'),
    0,
    process.env.BTC_TC_PREFIX
  );
};

export const getBech32FromBase58 = (address: string) => {
  const bAddress = bitcoin.address.fromBase58Check(address);

  return getBech32FromHex('0x' + bAddress.hash.toString('hex'));
};

export const getBech32Unify = (btcAddress: string) => {
  let txBech32Address;

  if (btcAddress.startsWith(process.env.BTC_TC_PREFIX)) {
    txBech32Address = btcAddress;
  } else {
    txBech32Address = getBech32FromBase58(btcAddress);
  }

  return txBech32Address;
};
