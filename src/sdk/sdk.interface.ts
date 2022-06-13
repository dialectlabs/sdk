import type {
  ApiAvailability,
  DialectWalletAdapter,
} from '@wallet-adapter/dialect-wallet-adapter.interface';
import type { PublicKey } from '@solana/web3.js';
import type { Messaging } from '@messaging/messaging.interface';
import type { TokenStore } from '@auth/internal/token-store';
import { DialectSdkFactory } from '@sdk/internal/sdk-factory';
import type { EncryptionKeysStore } from '@encryption/encryption-keys-store';

export abstract class Dialect {
  static sdk(config: Config): DialectSdk {
    return new DialectSdkFactory(config).create();
  }
}

export interface DialectSdk {
  readonly info: DialectSdkInfo;
  readonly threads: Messaging;
}

export interface DialectSdkInfo {
  readonly apiAvailability: ApiAvailability;
  readonly config: Config;
  readonly wallet: DialectWalletAdapter;
}

export type Environment = 'production' | 'development' | 'local-development';

export interface Config {
  environment?: Environment;
  wallet: DialectWalletAdapter;
  solana?: SolanaConfig;
  dialectCloud?: DialectCloudConfig;
  encryptionKeysStore?: EncryptionKeysStore;
  backends?: Backend[];
}

export interface SolanaConfig {
  network?: SolanaNetwork;
  dialectProgramAddress?: PublicKey;
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

export enum Backend {
  Solana = 'SOLANA',
  DialectCloud = 'DIALECT_CLOUD',
}
