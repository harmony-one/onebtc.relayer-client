const bitcoin = require('bitcoinjs-lib');

export const getBech32FromHex = (addressHex: string) => {
    return bitcoin.address.toBech32(Buffer.from(addressHex.slice(2), 'hex'), 0, 'tb');
};
