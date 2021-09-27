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

export interface IRegisterVault extends IEvent {
    returnValues: {
        vaultId: string;
        collateral: string;
        btcPublicKeyX: string;
        btcPublicKeyY: string;
    };
}
