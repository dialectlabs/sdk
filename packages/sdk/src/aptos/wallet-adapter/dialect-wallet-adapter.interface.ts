import type { WalletAdapterProps } from '@manahippo/aptos-wallet-adapter';

export interface DialectWalletAdapter {
  publicAccount?: WalletAdapterProps['publicAccount'];
  signMessage?: WalletAdapterProps['signMessage'];
}
