const bip32 = require('bip32');
const bitcoin = require('bitcoinjs-lib');

const isUsedInInputs = (txs, output) => {
  return txs.some(tx =>
    tx.inputs.some(input => {
      const { hash, index } = input.prevout;
      return hash === output.hash && index === output.index;
    })
  );
};

export const getActualOutputs = (allTxs: any[], mainAddress: string) => {
  const outputsToUse = [];

  const txs = allTxs.filter(tx => tx.confirmations > 0 && tx.height > -1);

  txs.forEach(tx => {
    tx.outputs.forEach((out, index) => {
      if (out.address === mainAddress && !isUsedInInputs(allTxs, { hash: tx.hash, index })) {
        outputsToUse.push({
          hash: tx.hash,
          index,
          hex: tx.hex,
          value: out.value,
        });
      }
    });
  });

  return outputsToUse;
};

const getNetwork = () =>
  process.env.HMY_NETWORK === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

const isBase58 = (key: string) => ['tprv', 'xprv'].includes(key.slice(0, 4));

const isWIF = (key: string) => key.length === 52 || key.length === 51;

const isHex = (key: string) => {
  const regExp = /[0-9A-Fa-f]{6}/g;

  return regExp.test(key) && key.length === 64;
};

export const convertBtcKeyToHex = (btcKey: string) => {
  if (isHex(btcKey)) {
    return btcKey;
  }

  if (isBase58(btcKey)) {
    const bip32Obj = bip32.fromBase58(btcKey, getNetwork());

    return bip32Obj.privateKey.toString('hex');
  }

  if (isWIF(btcKey)) {
    const vaultEcPair = bitcoin.ECPair.fromWIF(btcKey, getNetwork());
    return vaultEcPair.privateKey.toString('hex');
  }

  throw new Error('BTC KEY Wrong format');
};
