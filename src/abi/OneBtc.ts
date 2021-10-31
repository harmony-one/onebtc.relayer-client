export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'replaceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'oldVault',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newVault',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'btcAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'AcceptReplace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'replaceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'oldVault',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newVault',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'slashedCollateral',
        type: 'uint256',
      },
    ],
    name: 'CancelReplace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'DecreaseToBeIssuedTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'DecreaseToBeReplacedTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'replaceId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'oldVault',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newVault',
        type: 'address',
      },
    ],
    name: 'ExecuteReplace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'IncreaseToBeIssuedTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'IncreaseToBeRedeemedTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'IncreaseToBeReplacedTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'issuedId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'confiscatedGriefingCollateral',
        type: 'uint256',
      },
    ],
    name: 'IssueAmountChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'issuedId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'IssueCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'issuedId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'IssueCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'issueId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'IssueRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'IssueTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'LockCollateral',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'redeemId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'RedeemCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'redeemId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'RedeemCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'redeemId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
    ],
    name: 'RedeemRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'RedeemTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'btcPublicKeyX',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'btcPublicKeyY',
        type: 'uint256',
      },
    ],
    name: 'RegisterVault',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ReleaseCollateral',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'oldVaultId',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newVaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokens',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
    ],
    name: 'ReplaceTokens',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'oldVault',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'btcAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'griefingCollateral',
        type: 'uint256',
      },
    ],
    name: 'RequestReplace',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'SlashCollateral',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'x',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'y',
        type: 'uint256',
      },
    ],
    name: 'VaultPublicKeyUpdate',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'oldVault',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'withdrawnTokens',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'withdrawnGriefingCollateral',
        type: 'uint256',
      },
    ],
    name: 'WithdrawReplace',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'CollateralBalances',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'CollateralUsed',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'threshold',
        type: 'uint256',
      },
    ],
    name: 'calculateMaxWrappedFromCollateralForThreshold',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'collateralToWrapped',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'subtractedValue',
        type: 'uint256',
      },
    ],
    name: 'decreaseAllowance',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getExchangeRate',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'addedValue',
        type: 'uint256',
      },
    ],
    name: 'increaseAllowance',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
    ],
    name: 'issuableTokens',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'issueRequests',
    outputs: [
      {
        internalType: 'address payable',
        name: 'vault',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'opentime',
        type: 'uint256',
      },
      {
        internalType: 'address payable',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'btcPublicKey',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'griefingCollateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'period',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcHeight',
        type: 'uint256',
      },
      {
        internalType: 'enum RequestStatus',
        name: 'status',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
    ],
    name: 'issued',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'lockAdditionalCollateral',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
    payable: true,
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'realy',
    outputs: [
      {
        internalType: 'contract IRelay',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'redeemRequests',
    outputs: [
      {
        internalType: 'address',
        name: 'vault',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'opentime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'period',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'fee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountBtc',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'transferFeeBtc',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountOne',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'premiumOne',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'btcHeight',
        type: 'uint256',
      },
      {
        internalType: 'enum RequestStatus',
        name: 'status',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'btcPublicKeyX',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcPublicKeyY',
        type: 'uint256',
      },
    ],
    name: 'registerVault',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
    payable: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'replaceRequests',
    outputs: [
      {
        internalType: 'address payable',
        name: 'oldVault',
        type: 'address',
      },
      {
        internalType: 'address payable',
        name: 'newVault',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'acceptTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'griefingCollateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'period',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcHeight',
        type: 'uint256',
      },
      {
        internalType: 'enum RequestStatus',
        name: 'status',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'secureCollateralThreshold',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
    ],
    name: 'toBeRedeemed',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'totalCollateral',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'btcPublicKeyX',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcPublicKeyY',
        type: 'uint256',
      },
    ],
    name: 'updatePublicKey',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'vaults',
    outputs: [
      {
        internalType: 'uint256',
        name: 'btcPublicKeyX',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcPublicKeyY',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'issued',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'toBeIssued',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'toBeRedeemed',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'replaceCollateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'toBeReplaced',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'withdrawCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IRelay',
        name: '_relay',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint32',
        name: 'height',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'rawTx',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'header',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'merkleProof',
        type: 'bytes',
      },
    ],
    name: 'verifyTx',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountRequested',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
    ],
    name: 'requestIssue',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
    payable: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'issueId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'merkleProof',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'rawTx',
        type: 'bytes',
      },
      {
        internalType: 'uint32',
        name: 'height',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'header',
        type: 'bytes',
      },
    ],
    name: 'executeIssue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'issueId',
        type: 'uint256',
      },
    ],
    name: 'cancelIssue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountOneBtc',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'btcAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'vaultId',
        type: 'address',
      },
    ],
    name: 'requestRedeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'redeemId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'merkleProof',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'rawTx',
        type: 'bytes',
      },
      {
        internalType: 'uint32',
        name: 'height',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'header',
        type: 'bytes',
      },
    ],
    name: 'executeRedeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'requester',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'redeemId',
        type: 'uint256',
      },
    ],
    name: 'cancelRedeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'oldVaultId',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'btcAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'griefingCollateral',
        type: 'uint256',
      },
    ],
    name: 'requestReplace',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
    payable: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'oldVaultId',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'newVaultId',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'btcAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'collateral',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcPublicKeyX',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'btcPublicKeyY',
        type: 'uint256',
      },
    ],
    name: 'acceptReplace',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
    payable: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'replaceId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'merkleProof',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'rawTx',
        type: 'bytes',
      },
      {
        internalType: 'uint32',
        name: 'height',
        type: 'uint32',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'header',
        type: 'bytes',
      },
    ],
    name: 'executeReplace',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
