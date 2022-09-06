import { DataServiceDappMessages } from '../../core/internal/dapp/data-service-dapp-messages';
import type {
  Config,
  ConfigProps,
  DialectCloudConfig,
  DialectSdk,
  DialectSdkInfo,
  IdentityConfig,
  SolanaConfig,
} from '../../sdk/sdk.interface';
import { Backend } from '../../sdk/sdk.interface';
import type { IdentityResolver } from '../../core/identity/identity.interface';
import { DialectWalletAdapterEd25519TokenSigner } from '../../solana/auth/ed25519/ed25519-token-signer';
import { EncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import {
  DEFAULT_TOKEN_LIFETIME,
  TokenProvider,
} from '../../core/auth/token-provider';
import type { Wallets } from '../../core/wallet/wallet.interface';
import { SolanaMessaging } from '../messaging/solana-messaging';
import type {
  DappAddresses,
  DappMessages,
  Dapps,
} from '../../core/dapp/dapp.interface';
import { DataServiceDappNotificationSubscriptions } from '../../core/internal/dapp/data-service-dapp-notification-subscriptions';
import type { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { createDialectProgram } from '../messaging/solana-dialect-program-factory';
import { Duration } from 'luxon';
import { DialectWalletAdapterSolanaTxTokenSigner } from '../../solana/auth/solana-tx/solana-tx-token-signer';
import { DataServiceApi } from '../data-service-api/data-service-api';
import { DappMessagesFacade } from '../../core/internal/dapp/dapp-messages-facade';
import { DappsImpl } from '../../core/internal/dapp/dapp';
import { programs } from '@dialectlabs/web3';
import type { DataServiceDappNotificationTypesApi } from '../data-service-api/data-service-dapp-notification-types-api';
import { TokenStore } from '../../core/auth/token-store';
import { DappAddressesFacade } from '../../core/internal/dapp/dapp-addresses-facade';
import {
  AggregateSequentialIdentityResolver,
  FirstFoundFastIdentityResolver,
  FirstFoundIdentityResolver,
} from '../identity/identity-resolvers';
import { DataServiceWallets } from '../wallet/data-service-wallets';
import { EncryptionKeysStore } from '../../encryption/encryption-keys-store';
import { DataServiceMessaging } from '../messaging/data-service-messaging';
import {
  MessagingBackend,
  MessagingFacade,
} from '../messaging/messaging-facade';
import { IllegalArgumentError } from '../../sdk/errors';
import type { DataServiceDappNotificationSubscriptionsApi } from '../data-service-api/data-service-dapp-notification-subscriptions-api';
import { DataServiceDappAddresses } from '../../core/internal/dapp/data-service-dapp-addresses';
import { SolanaDappMessages } from '../../solana/dapp/solana-dapp-messages';
import type { DataServiceDialectsApi } from '../data-service-api/data-service-dialects-api';
import type { DataServiceDappsApi } from '../data-service-api/data-service-dapps-api';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { DataServiceDappNotificationTypes } from '../../core/internal/dapp/data-service-dapp-notification-types';
import type { Messaging } from '../../core/messaging/messaging.interface';
import { SolanaDappAddresses } from '../../solana/dapp/solana-dapp-addresses';
import { Ed25519AuthenticationFacadeFactory } from '../../core/auth/ed25519/ed25519-authentication-facade-factory';
import { SolanaTxAuthenticationFacadeFactory } from '../../solana/auth/solana-tx/solana-tx-authentication-facade-factory';

interface InternalConfig extends Config {
  wallet: DialectWalletAdapterWrapper;
}

export class InternalDialectSdk implements DialectSdk {
  constructor(
    readonly info: DialectSdkInfo,
    readonly threads: Messaging,
    readonly dapps: Dapps,
    readonly wallet: Wallets,
    readonly identity: IdentityResolver,
  ) {}
}

export class DialectSdkFactory {
  constructor(private readonly config: ConfigProps) {}

  create(): DialectSdk {
    const config: InternalConfig = this.initializeConfig();
    DialectSdkFactory.logConfiguration(config);
    const dialectProgram: Program = createDialectProgram(
      config.wallet,
      config.solana.dialectProgramAddress,
      config.solana.rpcUrl,
    );
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      config.wallet,
      config.encryptionKeysStore,
    );
    const authenticationFacadeFactory = config.wallet.canSignMessage()
      ? new Ed25519AuthenticationFacadeFactory(
          new DialectWalletAdapterEd25519TokenSigner(config.wallet),
        )
      : new SolanaTxAuthenticationFacadeFactory(
          new DialectWalletAdapterSolanaTxTokenSigner(config.wallet),
        );

    const authenticationFacade = authenticationFacadeFactory.get();

    const tokenProvider: TokenProvider = TokenProvider.create(
      authenticationFacade,
      Duration.fromObject({
        minutes: config.dialectCloud.tokenLifetimeMinutes,
      }),
      config.dialectCloud.tokenStore,
    );
    const dataServiceApi: DataServiceApi = DataServiceApi.create(
      config.dialectCloud.url,
      tokenProvider,
    );
    const messaging = this.createMessaging(
      config,
      encryptionKeysProvider,
      dialectProgram,
      dataServiceApi.threads,
    );
    const dapps = this.createDapps(
      config,
      encryptionKeysProvider,
      dialectProgram,
      dataServiceApi.dapps,
      dataServiceApi.dappNotificationTypes,
      dataServiceApi.dappNotificationSubscriptions,
    );
    const wallet = new DataServiceWallets(
      config.wallet.publicKey,
      dataServiceApi.walletAddresses,
      dataServiceApi.walletDappAddresses,
      dataServiceApi.walletMessages,
      dataServiceApi.walletNotificationSubscriptions,
      dataServiceApi.pushNotificationSubscriptions,
    );
    const identity = this.createIdentityResolver(config.identity);

    return new InternalDialectSdk(
      {
        apiAvailability: config.wallet,
        config,
        wallet: config.wallet,
        solana: {
          dialectProgram,
        },
        tokenProvider,
      },
      messaging,
      dapps,
      wallet,
      identity,
    );
  }

  private static logConfiguration(config: InternalConfig) {
    if (config.environment !== 'production') {
      console.log(
        `Initializing Dialect SDK using configuration:
Wallet: 
  Public key: ${config.wallet.publicKey}
  Supports encryption: ${config.wallet.canEncrypt}
Enabled backends: ${JSON.stringify(config.backends)}
Dialect cloud settings:
  URL: ${config.dialectCloud.url}
Solana settings:
  Dialect program: ${config.solana.dialectProgramAddress}
  RPC URL: ${config.solana.rpcUrl}
`,
      );
    }
  }

  private createMessaging(
    config: InternalConfig,
    encryptionKeysProvider: EncryptionKeysProvider,
    program: Program,
    dataServiceDialectsApi: DataServiceDialectsApi,
  ) {
    const messagingBackends: MessagingBackend[] = config.backends.map(
      (backend) => {
        switch (backend) {
          case Backend.Solana:
            return {
              backend,
              messaging: new SolanaMessaging(
                config.wallet,
                program,
                encryptionKeysProvider,
              ),
            };
          case Backend.DialectCloud:
            return {
              backend,
              messaging: new DataServiceMessaging(
                config.wallet.publicKey,
                dataServiceDialectsApi,
                encryptionKeysProvider,
              ),
            };
          default:
            throw new IllegalArgumentError(`Unknown backend ${backend}`);
        }
      },
    );
    return new MessagingFacade(messagingBackends);
  }

  private createDapps(
    config: InternalConfig,
    encryptionKeysProvider: EncryptionKeysProvider,
    program: Program,
    dataServiceDappsApi: DataServiceDappsApi,
    dataServiceDappNotificationTypesApi: DataServiceDappNotificationTypesApi,
    dappNotificationSubscriptionsApi: DataServiceDappNotificationSubscriptionsApi,
  ) {
    const dappAddressesBackends: DappAddresses[] = config.backends.map(
      (backend) => {
        switch (backend) {
          case Backend.Solana:
            return new SolanaDappAddresses(program);
          case Backend.DialectCloud:
            return new DataServiceDappAddresses(dataServiceDappsApi);
          default:
            throw new IllegalArgumentError(`Unknown backend ${backend}`);
        }
      },
    );
    const dappNotificationTypes = new DataServiceDappNotificationTypes(
      dataServiceDappNotificationTypesApi,
    );
    const dappNotificationSubscriptions =
      new DataServiceDappNotificationSubscriptions(
        dappNotificationSubscriptionsApi,
      );
    const dappAddressesFacade = new DappAddressesFacade(dappAddressesBackends);
    const dappMessageBackends: DappMessages[] = config.backends.map(
      (backend) => {
        switch (backend) {
          case Backend.Solana:
            return new SolanaDappMessages(
              new SolanaMessaging(
                config.wallet,
                program,
                encryptionKeysProvider,
              ),
              new SolanaDappAddresses(program),
              dappNotificationTypes,
              dappNotificationSubscriptions,
            );
          case Backend.DialectCloud:
            return new DataServiceDappMessages(dataServiceDappsApi);
          default:
            throw new IllegalArgumentError(`Unknown backend ${backend}`);
        }
      },
    );
    const dappMessagesFacade = new DappMessagesFacade(dappMessageBackends);
    return new DappsImpl(
      dappAddressesFacade,
      dappMessagesFacade,
      dappNotificationTypes,
      dappNotificationSubscriptions,
      dataServiceDappsApi,
    );
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

  private initializeConfig(): InternalConfig {
    const environment = this.config.environment ?? 'production';
    const wallet = DialectWalletAdapterWrapper.create(this.config.wallet);
    const backends = this.initializeBackends();
    const encryptionKeysStore = this.createEncryptionKeysStore();
    const identity = this.createIdentityConfig();
    return {
      environment,
      wallet,
      dialectCloud: this.initializeDialectCloudConfig(),
      solana: this.initializeSolanaConfig(),
      encryptionKeysStore,
      backends,
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

  private initializeBackends() {
    const backends = this.config.backends;
    if (!backends) {
      return [Backend.DialectCloud, Backend.Solana];
    }
    if (backends.length < 1) {
      throw new IllegalArgumentError('Please specify at least one backend.');
    }
    return backends;
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

  private initializeSolanaConfig(): SolanaConfig {
    let internalConfig: SolanaConfig = {
      network: 'mainnet-beta',
      dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
      rpcUrl: programs.mainnet.clusterAddress,
    };
    const environment = this.config.environment;
    if (environment === 'production') {
      const network = 'mainnet-beta';
      internalConfig = {
        network,
        dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
        rpcUrl: programs.mainnet.clusterAddress,
      };
    }
    if (environment === 'development') {
      const network = 'devnet';
      internalConfig = {
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }
    if (environment === 'local-development') {
      const network = 'localnet';
      internalConfig = {
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }
    const solanaNetwork = this.config.solana?.network;
    if (solanaNetwork === 'mainnet-beta') {
      const network = 'mainnet-beta';
      internalConfig = {
        network,
        dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
        rpcUrl: programs.mainnet.clusterAddress,
      };
    }
    if (solanaNetwork === 'devnet') {
      const network = 'devnet';
      internalConfig = {
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }
    if (solanaNetwork === 'localnet') {
      const network = 'localnet';
      internalConfig = {
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }

    if (this.config.solana?.dialectProgramAddress) {
      internalConfig.dialectProgramAddress =
        this.config.solana.dialectProgramAddress;
    }
    if (this.config.solana?.rpcUrl) {
      internalConfig.rpcUrl = this.config.solana.rpcUrl;
    }
    return internalConfig;
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
