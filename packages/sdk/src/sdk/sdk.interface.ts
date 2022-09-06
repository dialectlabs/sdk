import type {
  ApiAvailability,
  DialectWalletAdapter,
} from '../wallet-adapter/dialect-wallet-adapter.interface';
import type { TokenProvider } from '../core/auth/token-provider';
import type { Wallets } from '../wallet/wallet.interface';
import type { Program } from '@project-serum/anchor';
import type { PublicKey } from '@solana/web3.js';
import type { EncryptionKeysStore } from '../encryption/encryption-keys-store';
import type { Messaging } from '../messaging/messaging.interface';
import type { Dapps } from '../core/dapp/dapp.interface';
import type { IdentityResolver } from '../core/identity/identity.interface';
import type { TokenStore } from '../core/auth/token-store';
import { DialectSdkFactory } from '../internal/sdk/sdk-factory';

export abstract class Dialect {
  static sdk(config: ConfigProps): DialectSdk {
    return new DialectSdkFactory(config).create();
  }
}

export interface DialectSdk {
  readonly info: DialectSdkInfo;
  readonly threads: Messaging;
  readonly dapps: Dapps;
  readonly wallet: Wallets;
  readonly identity: IdentityResolver;
}

export interface DialectSdkInfo {
  readonly apiAvailability: ApiAvailability;
  readonly config: Config;
  readonly wallet: DialectWalletAdapter;
  readonly solana: SolanaInfo;
  readonly tokenProvider: TokenProvider;
}

export interface SolanaInfo {
  dialectProgram: Program;
}

export type Environment = 'production' | 'development' | 'local-development';
export type TokenStoreType = 'in-memory' | 'session-storage' | 'local-storage';
export type EncryptionKeysStoreType =
  | 'in-memory'
  | 'session-storage'
  | 'local-storage';

export interface ConfigProps {
  environment?: Environment;
  wallet: DialectWalletAdapter;
  solana?: SolanaConfigProps;
  dialectCloud?: DialectCloudConfigProps;
  encryptionKeysStore?: EncryptionKeysStoreType | EncryptionKeysStore;
  backends?: Backend[];
  identity?: IdentityConfigProps;
}

export interface SolanaConfigProps {
  network?: SolanaNetwork;
  dialectProgramAddress?: PublicKey;
  rpcUrl?: string;
}

export interface DialectCloudConfigProps {
  environment?: DialectCloudEnvironment;
  url?: string;
  tokenStore?: TokenStoreType | TokenStore;
  tokenLifetimeMinutes?: number;
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

type IdentityResolveStrategy =
  | 'first-found'
  | 'first-found-fast'
  | 'aggregate-sequential';

export interface IdentityConfigProps {
  strategy?: IdentityResolveStrategy;
  resolvers?: IdentityResolver[];
}

export interface Config extends ConfigProps {
  environment: Environment;
  wallet: DialectWalletAdapter;
  solana: SolanaConfig;
  dialectCloud: DialectCloudConfig;
  encryptionKeysStore: EncryptionKeysStore;
  backends: Backend[];
  identity: IdentityConfig;
}

export interface SolanaConfig extends SolanaConfigProps {
  network: SolanaNetwork;
  dialectProgramAddress: PublicKey;
  rpcUrl: string;
}

export interface DialectCloudConfig extends DialectCloudConfigProps {
  environment: DialectCloudEnvironment;
  url: string;
  tokenStore: TokenStore;
  tokenLifetimeMinutes: number;
}

export interface IdentityConfig extends IdentityConfigProps {
  strategy: IdentityResolveStrategy;
  resolvers: IdentityResolver[];
}
