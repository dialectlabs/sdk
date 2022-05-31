import type { DialectWalletAdapter } from './wallet-adapter.interface';
import type { PublicKey } from '@solana/web3.js';
import type { TokenStore } from './internal/wallet-adapter/token';
import type { Messaging } from './messaging.interface';
import { DialectSdkFactory } from './internal/sdk-factory';

export class DialectSdk {
  constructor(
    readonly dialects: Messaging, // readonly wallet: Wallets, // readonly dapps: Dapps,
  ) {}

  static create(config: Config): DialectSdk {
    const factory = new DialectSdkFactory(config);
    return factory.create();
  }
}

export type Environment = 'production' | 'development' | 'local-development';

export interface Config {
  environment?: Environment;
  wallet: DialectWalletAdapter;
  solana?: SolanaConfig;
  dialectCloud?: DialectCloudConfig;
  messagingBackendPreference?: MessagingBackendPreference;
}

export interface SolanaConfig {
  network?: SolanaNetwork;
  dialectProgramId?: PublicKey;
  rpcUrl?: string;
}

export interface DialectCloudConfig {
  environment?: DialectCloudEnvironment;
  url?: string;
  tokenStore?: TokenStore;
}

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'localnet';

export type DialectCloudEnvironment =
  | 'production'
  | 'development'
  | 'local-development';

export enum MessagingBackendPreference {
  SOLANA = 'SOLANA',
  DATA_SERVICE = 'DATA_SERVICE',
}
