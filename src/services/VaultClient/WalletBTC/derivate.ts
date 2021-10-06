const BN = require('bn.js');
const bitcoin = require('bitcoinjs-lib');
import keccak256 from 'keccak256';
const ecc = require('tiny-secp256k1');

const Secp256k1_NN = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

const bn = b => BigInt(`0x${b.toString('hex')}`);

const toBuffer32 = bn => {
  let hexStr = bn.toString(16);
  const diff = 64 - hexStr.length;
  hexStr = '0'.repeat(diff) + hexStr;
  return Buffer.from(hexStr, 'hex');
};

export const derivate = (priD, id) => {
  const ecPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(priD, 'hex'), { compressed: false });
  const scale = keccak256(Buffer.concat([ecPair.publicKey.slice(1), new BN(id).toBuffer()]));

  // @ts-ignore
  if (bn(scale) % Secp256k1_NN == 0) throw new Error('Invalid scale');

  const derivatedPub = ecc.pointMultiply(ecPair.publicKey, scale, true);
  const derivatedPriD = (bn(priD) * bn(scale)) % Secp256k1_NN;

  const derivatedEcPair = bitcoin.ECPair.fromPrivateKey(toBuffer32(derivatedPriD), {
    compressed: true,
  });

  if (!derivatedEcPair.publicKey.equals(derivatedPub)) throw new Error('Derivated key is wrong');

  return derivatedEcPair;
};
