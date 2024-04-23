import type { SmartMessage, SmartMessageParams } from '@dialectlabs/sdk';

export interface TensorNftBuyNowSmartMessage extends SmartMessage {
  transactionServiceId: 'tensor-nft-buy-now';
  transactionParams: NftBuyTransactionParams;
}

export interface NftBuyTransactionParams extends SmartMessageParams {
  mintAddress: string;
  collectionId: string;
  price: string;
  owner: string;
  priceWithFeeAndRoyalty: string;
  imageUrl?: string;
  collectionName?: string;
  nftName?: string;
}

export interface TensorNftBuyCheapestSmartMessage extends SmartMessage {
  transactionServiceId: 'tensor-nft-buy-cheapest';
  transactionParams: NftBuyTransactionParams;
}

export interface NftBuyCheapestTransactionParams extends SmartMessageParams {
  collectionId: string;
  collectionName: string;
  imageUrl?: string;
}
