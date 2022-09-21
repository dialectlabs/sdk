import type { TokenProvider } from '../auth/token-provider';
import type { Wallets } from '../wallet/wallet.interface';
import type { Program } from '@project-serum/anchor';
import type { EncryptionKeysStore } from '../encryption/encryption-keys-store';
import type { Messaging } from '../messaging/messaging.interface';
import type {
  DappAddresses,
  DappMessages,
  Dapps,
} from '../dapp/dapp.interface';
import type { IdentityResolver } from '../identity/identity.interface';
import type { TokenStore } from '../auth/token-store';
import { DialectSdkFactory } from '../internal/sdk/sdk-factory';
import type { AuthenticationFacade } from '../auth/authentication-facade';
import type { EncryptionKeysProvider } from '../internal/encryption/encryption-keys-provider';

export abstract class Dialect {
  static sdk(
    config: ConfigProps,
    blockchainFactory: BlockchainFactory,
  ): DialectSdk {
    return new DialectSdkFactory(config, blockchainFactory).create();
  }
}

export interface ConfigProps {
  environment?: Environment;
  dialectCloud?: DialectCloudConfigProps;
  encryptionKeysStore?: EncryptionKeysStoreType | EncryptionKeysStore;
  identity?: IdentityConfigProps;
}

export interface BlockchainFactory {
  create(globalConfig: ConfigProps): BlockchainSdk;
}

export interface BlockchainSdk {
  readonly type: string;
  readonly authenticationFacade: AuthenticationFacade;
  readonly encryptionKeysProvider: EncryptionKeysProvider;
  readonly messaging?: Messaging;
  readonly dappMessages?: DappMessages;
  readonly dappAddresses?: DappAddresses;
}

export interface ApiAvailability {
  supportedBackends: Backend[];
  canEncrypt: boolean;
}

export interface DialectSdk {
  readonly info: DialectSdkInfo;
  readonly threads: Messaging;
  readonly dapps: Dapps;
  readonly wallet: Wallets;
  readonly identity: IdentityResolver;
}

export interface DialectSdkInfo {
  // readonly apiAvailability: ApiAvailability; // TODO
  readonly config: Config;
  // readonly solana: SolanaInfo; // TODO
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
  Facade = 'FACADE',
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
  dialectCloud: DialectCloudConfig;
  encryptionKeysStore: EncryptionKeysStore;
  identity: IdentityConfig;
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
