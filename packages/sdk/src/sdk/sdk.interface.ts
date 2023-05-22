import type { TokenProvider } from '../auth/token-provider';
import type { Wallets } from '../wallet/wallet.interface';
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
import type { EncryptionKeysProvider } from '../encryption/encryption-keys-provider';

export abstract class Dialect {
  static sdk<ChainSdk extends BlockchainSdk>(
    configProps: ConfigProps,
    blockchainSdkFactory: BlockchainSdkFactory<ChainSdk>,
  ): DialectSdk<ChainSdk> {
    return new DialectSdkFactory(configProps, blockchainSdkFactory).create();
  }
}

export interface ConfigProps {
  environment?: Environment;
  dialectCloud?: DialectCloudConfigProps;
  encryptionKeysStore?: EncryptionKeysStoreType | EncryptionKeysStore;
  identity?: IdentityConfigProps;
}

export interface BlockchainSdkFactory<ChainSdk extends BlockchainSdk> {
  create(config: Config): ChainSdk;
}

export abstract class BlockchainSdk {
  readonly type!: string;
  readonly info!: BlockChainSdkInfo;
  readonly authenticationFacade!: AuthenticationFacade;
  readonly encryptionKeysProvider!: EncryptionKeysProvider;
  readonly messaging?: Messaging;
  readonly dappMessages?: DappMessages;
  readonly dappAddresses?: DappAddresses;
}

export interface BlockChainSdkInfo {
  supportsOnChainMessaging: boolean;
}

export abstract class DialectSdk<ChainSdk extends BlockchainSdk> {
  readonly info!: DialectSdkInfo;
  readonly config!: Config;
  readonly threads!: Messaging;
  readonly dapps!: Dapps;
  readonly wallet!: Wallets;
  readonly identity!: IdentityResolver;
  readonly tokenProvider!: TokenProvider;
  readonly encryptionKeysProvider!: EncryptionKeysProvider;
  readonly blockchainSdk!: ChainSdk;
}

export interface DialectSdkInfo {
  supportsEndToEndEncryption: boolean;
  hasValidAuthentication: boolean;
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
  implicitWalletCreation?: boolean;
}

export type DialectCloudEnvironment =
  | 'production'
  | 'development'
  | 'local-development';

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
  implicitWalletCreation: boolean;
}

export interface IdentityConfig extends IdentityConfigProps {
  strategy: IdentityResolveStrategy;
  resolvers: IdentityResolver[];
}
