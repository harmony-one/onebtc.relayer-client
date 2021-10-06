const isUsedInInputs = (txs, output) => {
  return txs.some(tx =>
    tx.inputs.some(input => {
      const { hash, index } = input.prevout;
      return hash === output.hash && index === output.index;
    })
  );
};

export const getActualOutputs = (txs: any[], mainAddress: string) => {
  const outputsToUse = [];

  txs.forEach(tx => {
    tx.outputs.forEach((out, index) => {
      if (out.address === mainAddress && !isUsedInInputs(txs, { hash: tx.hash, index })) {
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
