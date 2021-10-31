/*
event RegisterVault(
    address indexed vaultId,
    uint256 collateral,
    uint256 btcPublicKeyX,
    uint256 btcPublicKeyY
);

event VaultPublicKeyUpdate(address indexed vaultId, uint256 x, uint256 y);
event IncreaseToBeIssuedTokens(address indexed vaultId, uint256 amount);
event IncreaseToBeRedeemedTokens(address indexed vaultId, uint256 amount);
event DecreaseToBeIssuedTokens(address indexed vaultId, uint256 amount);
event IssueTokens(address indexed vaultId, uint256 amount);
event RedeemTokens(address indexed vaultId, uint256 amount);
event IncreaseToBeReplacedTokens(address indexed vaultId, uint256 amount);
event DecreaseToBeReplacedTokens(address indexed vaultId, uint256 amount);
event ReplaceTokens(address indexed oldVaultId, address indexed newVaultId, uint256 tokens, uint256 collateral);
*/

export interface IEvent {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
  name: string;
}

export interface IRegisterVaultEvent extends IEvent {
  returnValues: {
    vaultId: string;
    collateral: string;
    btcPublicKeyX: string;
    btcPublicKeyY: string;
  };
}

export interface IVaultRegistry {
  id: string;
  vaultId: string;
  btcPublicKeyX: string;
  btcPublicKeyY: string;
  collateral: string;
  issued: string;
  toBeIssued: string;
  toBeRedeemed: string;
  replaceCollateral: string;
  toBeReplaced: string;
  lastPing?: number;
}

export interface IssueRequest {
  id: string;
  vault: string;
  opentime: string;
  requester: string;
  btcAddress: string;
  btcPublicKey: string;
  amount: string;
  fee: string;
  griefingCollateral: string;
  period: string;
  btcHeight: string;
  status: string;
  lastUpdate: number;
  btcTx?: {
    hash: string;
    hex: string;
    fee: number;
    rate: number;
    height: number;
    inputs: any[];
    outputs: any[];
  };
}

export interface RedeemRequest {
  id: string;
  vault: string;
  opentime: string;
  requester: string;
  btcAddress: string;
  amountOne: string;
  amountBtc: string;
  premiumOne: string;
  fee: string;
  transferFeeBtc: string;
  period: string;
  btcHeight: string;
  status: string;
  lastUpdate: number;
}

export interface IssueRequestEvent extends IEvent {
  returnValues: {
    issueId: string;
    requester: string;
    vaultId: string;
    amount: string;
    fee: string;
    btcAddress: string;
  };
}

export enum CONTRACT_EVENT {
  RegisterVault = 'RegisterVault',
  RedeemRequest = 'RedeemRequested',
  IssueRequest = 'IssueRequested',
}
