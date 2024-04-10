import type { TransactionParams } from '../transaction-action-spec';

export interface NftBuyTransaction extends TransactionParams {
  mintAddress: string;
  collectionId: string;
  price: string;
  owner: string;
  priceWithFeeAndRoyalty: string;
  imageUrl?: string;
  collectionName?: string;
  nftName?: string;
}