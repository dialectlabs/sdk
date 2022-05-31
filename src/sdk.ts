import type { Dapps, Wallets } from './internal/dapp/dapps';
import type { DialectWalletAdapter } from './wallet-adapter.interface';
import type { PublicKey } from '@solana/web3.js';
import type { TokenStore } from './internal/wallet-adapter/token';
import type { Messaging } from './messaging.interface';

export class DialectSdk {
  constructor(
    readonly config: Config,
    readonly dialects: Messaging,
    readonly wallet: Wallets,
    readonly dapps: Dapps,
  ) {}

  static create(config: Config): DialectSdk {
    throw new Error('Not implemented');
  }
}

export type Environment = 'production' | 'development' | 'local-development';

export interface Config {
  environment?: Environment;
  wallet: DialectWalletAdapter;
  solana?: SolanaConfig;
  dialectCloud?: DialectCloudConfig;
}

export interface SolanaConfig {
  network?: SolanaNetwork;
  dialectProgramId?: PublicKey;
  rpcUrl?: string;
}

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'localnet';

export interface DialectCloudConfig {
  url?: string;
  tokenStore?: TokenStore;
}
