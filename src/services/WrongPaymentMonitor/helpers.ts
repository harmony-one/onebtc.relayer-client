import BN from 'bn.js';

export const isAmountEqual = (value, amount, fee) => {
    const a1 = new BN(value);
    const a2 = new BN(amount).add(new BN(fee));

    return a1.eq(a2);
}