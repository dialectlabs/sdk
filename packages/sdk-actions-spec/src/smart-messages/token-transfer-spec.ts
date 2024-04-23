import type { SmartMessage, SmartMessageParams } from '@dialectlabs/sdk';

export interface TokenTransferSmartMessage extends SmartMessage {
  transactionServiceId: 'token-transfer';
  transactionParams: TokenTransferSmartMessageParams;
}

export interface TokenTransferSmartMessageParams extends SmartMessageParams {
  payerWalletAddress: string;
  payeeWalletAddress: string;
  tokenMintAddress?: string;
  amount: string;
}
