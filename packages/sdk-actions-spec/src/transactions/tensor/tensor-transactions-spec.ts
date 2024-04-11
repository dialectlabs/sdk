import type { SmartMessage, SmartMessageAction, SmartMessageParams } from '@dialectlabs/sdk/src'; //TODO: upd import


export interface TensorNftBuySmartMessage extends SmartMessage {
  transactionServiceId: 'tensor-nft-buy';
  transactionParams: NftBuyTransactionParams;
}

export interface NftBuyTransactionParams extends  SmartMessageParams{
  mintAddress: string;
  collectionId: string;
  price: string;
  owner: string;
  priceWithFeeAndRoyalty: string;
  imageUrl?: string;
  collectionName?: string;
  nftName?: string;
}
