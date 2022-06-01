import type { DialectWalletAdapter } from './dialect-wallet-adapter.interface';
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
  readonly threads: Messaging;
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
