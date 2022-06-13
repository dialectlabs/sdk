import {
  Backend,
  Config,
  DialectCloudConfig,
  DialectCloudEnvironment,
  DialectSdk,
  DialectSdkInfo,
  Environment,
  SolanaConfig,
  SolanaNetwork,
} from '@sdk/sdk.interface';
import { InMemoryTokenStore, TokenStore } from '@auth/internal/token-store';
import { programs } from '@dialectlabs/web3';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import { DataServiceDialectsApiClient } from '@data-service-api/data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { DataServiceMessaging } from '@messaging/internal/data-service-messaging';
import { MessagingFacade } from '@messaging/internal/messaging-facade';
import { PublicKey } from '@solana/web3.js';
import { createDialectProgram } from '@messaging/internal/solana-dialect-program-factory';
import type { Messaging } from '@messaging/messaging.interface';
import { Duration } from 'luxon';
import { SolanaMessaging } from '@messaging/internal/solana-messaging';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import { DialectWalletAdapterEncryptionKeysProvider } from '@encryption/encryption-keys-provider';
import type { EncryptionKeysStore } from '@encryption/encryption-keys-store';
import { InmemoryEncryptionKeysStore } from '@encryption/encryption-keys-store';
import { IllegalArgumentError } from '@sdk/errors';

interface InternalConfig extends Config {
  environment: Environment;
  wallet: DialectWalletAdapterWrapper;
  solana: InternalSolanaConfig;
  dialectCloud: InternalDialectCloudConfig;
  encryptionKeysStore: EncryptionKeysStore;
  backends: Backend[];
}

interface InternalSolanaConfig extends SolanaConfig {
  network: SolanaNetwork;
  dialectProgramAddress: PublicKey;
  rpcUrl: string;
}

interface InternalDialectCloudConfig extends DialectCloudConfig {
  environment: DialectCloudEnvironment;
  url: string;
  tokenStore: TokenStore;
}

export class InternalDialectSdk implements DialectSdk {
  constructor(readonly info: DialectSdkInfo, readonly threads: Messaging) {}
}

export class DialectSdkFactory {
  private static DEFAULT_BACKENDS = [Backend.DialectCloud, Backend.Solana];

  constructor(private readonly config: Config) {}

  create(): DialectSdk {
    const config: InternalConfig = this.initializeConfig();
    console.log(
      `Initializing dialect sdk using config\n: ${JSON.stringify(config)}`,
    );
    const encryptionKeysProvider =
      new DialectWalletAdapterEncryptionKeysProvider(config.wallet);
    const messaging = this.createMessaging(config, encryptionKeysProvider);
    return new InternalDialectSdk(
      {
        apiAvailability: config.wallet,
        config,
        wallet: config.wallet,
      },
      messaging,
    );
  }

  private createMessaging(
    config: InternalConfig,
    encryptionKeysProvider: DialectWalletAdapterEncryptionKeysProvider,
  ) {
    const messagingOptions: Messaging[] = config.backends.map((backend) => {
      switch (backend) {
        case Backend.Solana:
          return new SolanaMessaging(
            config.wallet,
            createDialectProgram(
              config.wallet,
              config.solana.dialectProgramAddress,
              config.solana.rpcUrl,
            ),
            encryptionKeysProvider,
          );
        case Backend.DialectCloud:
          return new DataServiceMessaging(
            config.wallet.publicKey,
            new DataServiceDialectsApiClient(
              config.dialectCloud.url,
              TokenProvider.create(
                new DialectWalletAdapterEd25519TokenSigner(config.wallet),
                Duration.fromObject({ minutes: 60 }),
                config.dialectCloud.tokenStore,
              ),
            ),
            encryptionKeysProvider,
          );
        default:
          throw new IllegalArgumentError(`Unknown backend ${backend}`);
      }
    });
    return new MessagingFacade(messagingOptions);
  }

  private initializeConfig(): InternalConfig {
    const environment = this.config.environment ?? 'production';
    const wallet = DialectWalletAdapterWrapper.create(this.config.wallet);
    const backends = this.initializeBackends();
    const encryptionKeysStore =
      this.config.encryptionKeysStore ?? new InmemoryEncryptionKeysStore();
    return {
      environment,
      wallet,
      dialectCloud: this.initializeDialectCloudConfig(),
      solana: this.initializeSolanaConfig(),
      encryptionKeysStore,
      backends,
    };
  }

  private initializeBackends() {
    const backends = this.config.backends;
    if (!backends) {
      return DialectSdkFactory.DEFAULT_BACKENDS;
    }
    if (backends.length < 1) {
      throw new IllegalArgumentError('Please specify at least one backend.');
    }
    return backends;
  }

  private initializeDialectCloudConfig(): InternalDialectCloudConfig {
    let internalConfig: InternalDialectCloudConfig = {
      environment: 'production',
      url: 'https://dialectapi.to',
      tokenStore: new InMemoryTokenStore(),
    };
    const environment = this.config.environment;
    if (environment) {
      internalConfig.environment = environment;
    }
    if (environment === 'production' || environment === 'development') {
      internalConfig.url = 'https://dialectapi.to';
    }
    if (environment === 'local-development') {
      internalConfig.url = 'http://localhost:8080';
    }
    const dialectCloudEnvironment = this.config.dialectCloud?.environment;
    if (dialectCloudEnvironment) {
      internalConfig.environment = dialectCloudEnvironment;
    }
    if (
      dialectCloudEnvironment === 'production' ||
      dialectCloudEnvironment === 'development'
    ) {
      internalConfig.url = 'https://dialectapi.to';
    }
    if (dialectCloudEnvironment === 'local-development') {
      internalConfig.url = 'http://localhost:8080';
    }
    if (this.config.dialectCloud?.url) {
      internalConfig.url = this.config.dialectCloud.url;
    }
    if (this.config.dialectCloud?.tokenStore) {
      internalConfig.tokenStore = this.config.dialectCloud.tokenStore;
    }
    return internalConfig;
  }

  private initializeSolanaConfig(): InternalSolanaConfig {
    let internalConfig: InternalSolanaConfig = {
      network: 'mainnet-beta',
      dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
      rpcUrl: programs.mainnet.programAddress,
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
}
