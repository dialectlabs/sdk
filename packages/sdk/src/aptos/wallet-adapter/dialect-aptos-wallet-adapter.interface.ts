import type { WalletAdapterProps } from '@manahippo/aptos-wallet-adapter';

export interface DialectAptosWalletAdapter {
  publicAccount?: WalletAdapterProps['publicAccount'];
  signMessage?: WalletAdapterProps['signMessage'];
}
