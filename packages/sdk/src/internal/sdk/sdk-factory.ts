import { DataServiceDappMessages } from '../dapp/data-service-dapp-messages';
import type {
  BlockchainSdk,
  BlockchainSdkFactory,
  Config,
  ConfigProps,
  DialectCloudConfig,
  DialectSdk,
  DialectSdkInfo,
  IdentityConfig,
} from '../../sdk/sdk.interface';
import type { IdentityResolver } from '../../identity/identity.interface';
import {
  CachedTokenProvider,
  DEFAULT_TOKEN_LIFETIME,
  DefaultTokenProvider,
  TokenProvider,
} from '../../auth/token-provider';
import type { Wallets } from '../../wallet/wallet.interface';
import type {
  DappAddresses,
  DappMessages,
  Dapps,
} from '../../dapp/dapp.interface';
import { DataServiceDappNotificationSubscriptions } from '../dapp/data-service-dapp-notification-subscriptions';
import { Duration } from 'luxon';
import { DappMessagesFacade } from '../dapp/dapp-messages-facade';
import { DappsImpl } from '../dapp/dapp';
import { TokenStore } from '../../auth/token-store';
import { DappAddressesFacade } from '../dapp/dapp-addresses-facade';
import {
  AggregateSequentialIdentityResolver,
  FirstFoundFastIdentityResolver,
  FirstFoundIdentityResolver,
} from '../identity/identity-resolvers';
import { DataServiceWallets } from '../wallet/data-service-wallets';
import { EncryptionKeysStore } from '../../encryption/encryption-keys-store';
import { DataServiceMessaging } from '../messaging/data-service-messaging';
import { MessagingFacade } from '../messaging/messaging-facade';
import { IllegalArgumentError } from '../../sdk/errors';
import { DataServiceDappAddresses } from '../dapp/data-service-dapp-addresses';
import { DataServiceDappNotificationTypes } from '../dapp/data-service-dapp-notification-types';
import type { Messaging } from '../../messaging/messaging.interface';
import type { EncryptionKeysProvider } from '../../encryption/encryption-keys-provider';
import { DataServiceApiFactory } from '../../dialect-cloud-api/data-service-api-factory';
import type { DataServiceApi } from '../../dialect-cloud-api/data-service-api';
import { DataServiceWalletsApiClientV1 } from '../../dialect-cloud-api/data-service-wallets-api.v1';

export class InternalDialectSdk<ChainSdk extends BlockchainSdk>
  implements DialectSdk<ChainSdk>
{
  constructor(
    readonly config: Config,
    readonly threads: Messaging,
    readonly dapps: Dapps,
    readonly wallet: Wallets,
    readonly identity: IdentityResolver,
    readonly tokenProvider: CachedTokenProvider,
    readonly encryptionKeysProvider: EncryptionKeysProvider,
    readonly blockchainSdk: ChainSdk,
  ) {}

  get info(): DialectSdkInfo {
    return {
      supportsEndToEndEncryption: this.encryptionKeysProvider.isAvailable(),
      hasValidAuthentication: this.tokenProvider.hasValidCachedToken(),
    };
  }
}

export class DialectSdkFactory<ChainSdk extends BlockchainSdk> {
  constructor(
    private readonly config: ConfigProps,
    private readonly blockchainFactory: BlockchainSdkFactory<ChainSdk>,
  ) {}

  private static logConfiguration(config: Config) {
    if (config.environment !== 'production') {
      console.log(
        `Initializing Dialect SDK using configuration:
  Dialect cloud settings:
    URL: ${config.dialectCloud.url}
  `,
      );
    }
  }

  create(): DialectSdk<ChainSdk> {
    const config: Config = this.initializeConfig();
    DialectSdkFactory.logConfiguration(config);
    const blockchainSdk = this.blockchainFactory.create(config);
    const tokenProvider = this.initializeTokenProvider(config, blockchainSdk);
    const dataServiceApi = this.initializeDataServiceApi(
      config.dialectCloud,
      tokenProvider,
    );
    const messaging = this.initializeMessagingApi(
      dataServiceApi,
      blockchainSdk,
    );
    const dapps = this.initializeDappApi(dataServiceApi, blockchainSdk);
    const wallet = new DataServiceWallets(
      blockchainSdk.authenticationFacade.subject(),
      dataServiceApi.walletAddresses,
      dataServiceApi.walletDappAddresses,
      dataServiceApi.walletMessages,
      dataServiceApi.walletNotificationSubscriptions,
      dataServiceApi.pushNotificationSubscriptions,
    );
    const identity = this.createIdentityResolver(config.identity);
    return new InternalDialectSdk(
      config,
      messaging,
      dapps,
      wallet,
      identity,
      tokenProvider,
      blockchainSdk.encryptionKeysProvider,
      blockchainSdk,
    );
  }

  private initializeTokenProvider(
    config: Config,
    { authenticationFacade }: BlockchainSdk,
  ): CachedTokenProvider {
    const defaultTokenProvider = new DefaultTokenProvider(
      Duration.fromObject({
        minutes: config.dialectCloud.tokenLifetimeMinutes,
      }),
      authenticationFacade.tokenGenerator,
    );
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      config.dialectCloud.url,
    );
    return new CachedTokenProvider(
      defaultTokenProvider,
      config.dialectCloud.tokenStore,
      authenticationFacade.authenticator.parser,
      authenticationFacade.authenticator.validator,
      authenticationFacade.subject(),
      dataServiceWalletsApiV1,
    );
  }

  private initializeDataServiceApi(
    config: DialectCloudConfig,
    tokenProvider: TokenProvider,
  ) {
    return DataServiceApiFactory.create(config.url, tokenProvider);
  }

  private initializeMessagingApi(
    dataServiceApi: DataServiceApi,
    blockchainSdk: BlockchainSdk,
  ): Messaging {
    const messagings: Messaging[] = [];
    const dataServiceMessaging = new DataServiceMessaging(
      blockchainSdk.authenticationFacade.subject(),
      dataServiceApi.threads,
      blockchainSdk.encryptionKeysProvider,
    );
    messagings.push(dataServiceMessaging);
    if (blockchainSdk.messaging) {
      messagings.push(blockchainSdk.messaging);
    }
    return new MessagingFacade(messagings);
  }

  private initializeDappApi(
    dataServiceApi: DataServiceApi,
    blockchainSdk: BlockchainSdk,
  ): Dapps {
    const dappAddresses = this.createDappAddresses(
      dataServiceApi,
      blockchainSdk,
    );
    const dappNotificationTypes = new DataServiceDappNotificationTypes(
      dataServiceApi.dappNotificationTypes,
    );
    const dappNotificationSubscriptions =
      new DataServiceDappNotificationSubscriptions(
        dataServiceApi.dappNotificationSubscriptions,
      );
    const dappMessages = this.createDappMessages(dataServiceApi, blockchainSdk);
    return new DappsImpl(
      dappAddresses,
      dappMessages,
      dappNotificationTypes,
      dappNotificationSubscriptions,
      dataServiceApi.dapps,
    );
  }

  private createDappAddresses(
    dataServiceApi: DataServiceApi,
    blockchainSdk: BlockchainSdk,
  ): DappAddresses {
    const dappAddresses: DappAddresses[] = [];
    const dataServiceDappAddresses = new DataServiceDappAddresses(
      dataServiceApi.dapps,
    );
    dappAddresses.push(dataServiceDappAddresses);
    if (blockchainSdk.dappAddresses) {
      dappAddresses.push(blockchainSdk.dappAddresses);
    }
    return new DappAddressesFacade(dappAddresses);
  }

  private createDappMessages(
    dataServiceApi: DataServiceApi,
    blockchainSdk: BlockchainSdk,
  ): DappMessages {
    const dappMessages: DappMessages[] = [];
    const dataServiceDappMessages = new DataServiceDappMessages(
      dataServiceApi.dapps,
    );
    dappMessages.push(dataServiceDappMessages);
    if (blockchainSdk.dappMessages) {
      dappMessages.push(blockchainSdk.dappMessages);
    }
    return new DappMessagesFacade(dappMessages);
  }

  private createIdentityResolver(config: IdentityConfig): IdentityResolver {
    if (config.strategy === 'first-found') {
      return new FirstFoundIdentityResolver(config.resolvers);
    }
    if (config.strategy === 'first-found-fast') {
      return new FirstFoundFastIdentityResolver(config.resolvers);
    }
    if (config.strategy === 'aggregate-sequential') {
      return new AggregateSequentialIdentityResolver(config.resolvers);
    }

    throw new IllegalArgumentError(
      `Unknown identity strategy ${config.strategy}`,
    );
  }

  private initializeConfig(): Config {
    const environment = this.config.environment ?? 'production';
    const encryptionKeysStore = this.createEncryptionKeysStore();
    const identity = this.createIdentityConfig();
    return {
      environment,
      dialectCloud: this.initializeDialectCloudConfig(),
      encryptionKeysStore,
      identity,
    };
  }

  private createEncryptionKeysStore() {
    const encryptionKeysStoreConfig = this.config.encryptionKeysStore;
    if (
      encryptionKeysStoreConfig &&
      encryptionKeysStoreConfig instanceof EncryptionKeysStore
    ) {
      return encryptionKeysStoreConfig;
    }
    if (encryptionKeysStoreConfig === 'in-memory') {
      return EncryptionKeysStore.createInMemory();
    }
    if (encryptionKeysStoreConfig === 'session-storage') {
      return EncryptionKeysStore.createSessionStorage();
    }
    if (encryptionKeysStoreConfig === 'local-storage') {
      return EncryptionKeysStore.createLocalStorage();
    }
    return EncryptionKeysStore.createInMemory();
  }

  private initializeDialectCloudConfig(): DialectCloudConfig {
    const baseConfig: DialectCloudConfig = {
      environment: 'production',
      url: 'https://dialectapi.to',
      tokenStore: this.createTokenStore(),
      tokenLifetimeMinutes: this.createTokenLifetime(),
    };
    const environment = this.config.environment;
    if (environment) {
      baseConfig.environment = environment;
    }
    if (environment === 'production') {
      baseConfig.url = 'https://dialectapi.to';
    }
    if (environment === 'development') {
      baseConfig.url = 'https://dev.dialectapi.to';
    }
    if (environment === 'local-development') {
      baseConfig.url = 'http://localhost:8080';
    }
    const dialectCloudEnvironment = this.config.dialectCloud?.environment;
    if (dialectCloudEnvironment) {
      baseConfig.environment = dialectCloudEnvironment;
    }
    if (dialectCloudEnvironment === 'production') {
      baseConfig.url = 'https://dialectapi.to';
    }
    if (dialectCloudEnvironment === 'development') {
      baseConfig.url = 'https://dev.dialectapi.to';
    }
    if (dialectCloudEnvironment === 'local-development') {
      baseConfig.url = 'http://localhost:8080';
    }
    if (this.config.dialectCloud?.url) {
      baseConfig.url = this.config.dialectCloud.url;
    }
    return baseConfig;
  }

  private createTokenLifetime() {
    return (
      this.config.dialectCloud?.tokenLifetimeMinutes ??
      DEFAULT_TOKEN_LIFETIME.toMillis() / 1000 / 60
    );
  }

  private createTokenStore() {
    const tokenStoreConfig = this.config.dialectCloud?.tokenStore;
    if (tokenStoreConfig && tokenStoreConfig instanceof TokenStore) {
      return tokenStoreConfig;
    }
    if (tokenStoreConfig === 'in-memory') {
      return TokenStore.createInMemory();
    }
    if (tokenStoreConfig === 'session-storage') {
      return TokenStore.createSessionStorage();
    }
    if (tokenStoreConfig === 'local-storage') {
      return TokenStore.createLocalStorage();
    }
    return TokenStore.createInMemory();
  }

  private createIdentityConfig(): IdentityConfig {
    const identityConfig: IdentityConfig = {
      strategy: 'first-found',
      resolvers: [],
    };

    if (!this.config.identity) {
      return identityConfig;
    }

    if (this.config.identity.strategy) {
      identityConfig.strategy = this.config.identity.strategy;
    }

    if (this.config.identity.resolvers) {
      identityConfig.resolvers = this.config.identity.resolvers;
    }

    return identityConfig;
  }
}
