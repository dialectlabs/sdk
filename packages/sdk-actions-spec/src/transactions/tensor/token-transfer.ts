import type { SmartMessage, SmartMessageParams } from '@dialectlabs/sdk/src'; //TODO: upd import


export interface TokenTransferSmartMessage extends SmartMessage {
  transactionServiceId: 'tensor-nft-buy';
  transactionParams: TokenTransferSmartMessageParams;
}

export interface TokenTransferSmartMessageParams extends SmartMessageParams {
  payer: string;
  payee: string;
  amount: string;
  links: {
    label: string,
    url: string
  }[]
}
