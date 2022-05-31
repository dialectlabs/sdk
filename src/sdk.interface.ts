import type { DialectWalletAdapter } from './wallet-adapter.interface';
import type { PublicKey } from '@solana/web3.js';
import type { Messaging } from './messaging.interface';
import { DialectSdkFactory } from './internal/sdk-factory';
import type { TokenStore } from './internal/data-service-api/token-store';

export abstract class Dialect {
  static sdk(config: Config): DialectSdk {
    return new DialectSdkFactory(config).create();
  }
}

export interface DialectSdk {
  readonly dialects: Messaging;
}

export interface Config {
  environment?: Environment;
  wallet: DialectWalletAdapter;
  solana?: SolanaConfig;
  dialectCloud?: DialectCloudConfig;
}

export type Environment = 'production' | 'development' | 'local-development';

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
