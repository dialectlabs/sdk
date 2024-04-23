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

export interface TensorNftBuyFloorSmartMessage extends SmartMessage {
  transactionServiceId: 'tensor-nft-buy-floor';
  transactionParams: NftBuyFloorTransactionParams;
}

export interface NftBuyFloorTransactionParams extends SmartMessageParams {
  collectionId: string;
  collectionName: string;
  imageUrl?: string;
}
