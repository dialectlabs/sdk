import type { WalletAdapterProps } from '@manahippo/aptos-wallet-adapter';

export interface DialectAptosWalletAdapter {
  publicKey?: WalletAdapterProps['publicAccount']['publicKey'];
  address?: WalletAdapterProps['publicAccount']['address'];
  signMessage?: WalletAdapterProps['signMessage'];
}
