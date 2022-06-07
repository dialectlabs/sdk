import {
  Config,
  DialectCloudEnvironment,
  DialectSdk,
  Environment,
  MessagingBackend,
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
import type { FailSafeDialectWalletAdapterProps } from '@wallet-adapter/dialect-wallet-adapter.interface';

interface InternalConfig {
  environment: Environment;
  wallet: DialectWalletAdapterWrapper;
  solana: InternalSolanaConfig;
  dialectCloud: InternalDialectCloudConfig;
  encryptionKeysStore: EncryptionKeysStore;
  preferableMessagingBackend: MessagingBackend;
}

interface InternalSolanaConfig {
  network: SolanaNetwork;
  dialectProgramAddress: PublicKey;
  rpcUrl: string;
}

interface InternalDialectCloudConfig {
  environment: DialectCloudEnvironment;
  url: string;
  tokenStore: TokenStore;
}

export class InternalDialectSdk implements DialectSdk {
  constructor(
    readonly threads: Messaging,
    readonly wallet: FailSafeDialectWalletAdapterProps,
  ) {}
}

export class DialectSdkFactory {
  constructor(private readonly config: Config) {}

  create(): DialectSdk {
    const config: InternalConfig = this.initializeConfig();
    console.log(
      `Initializing dialect sdk using config\n: ${JSON.stringify(config)}`,
    );
    const encryptionKeysProvider =
      new DialectWalletAdapterEncryptionKeysProvider(config.wallet);

    const dataServiceMessaging = new DataServiceMessaging(
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
    const solanaMessaging = new SolanaMessaging(
      config.wallet,
      createDialectProgram(
        config.wallet,
        config.solana.dialectProgramAddress,
        config.solana.rpcUrl,
      ),
      encryptionKeysProvider,
    );
    const messagingFacade = new MessagingFacade(
      dataServiceMessaging,
      solanaMessaging,
      config.preferableMessagingBackend,
    );
    return new InternalDialectSdk(messagingFacade, config.wallet);
  }

  private initializeConfig(): InternalConfig {
    const environment = this.config.environment ?? 'production';
    const wallet = DialectWalletAdapterWrapper.create(this.config.wallet);
    return {
      environment,
      wallet,
      dialectCloud: this.initializeDialectCloudConfig(),
      solana: this.initializeSolanaConfig(),
      encryptionKeysStore:
        this.config.encryptionKeysStore ?? new InmemoryEncryptionKeysStore(),
      preferableMessagingBackend:
        this.config.preferableMessagingBackend ?? MessagingBackend.DialectCloud,
    };
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

    if (this.config.solana?.dialectProgramId) {
      internalConfig.dialectProgramAddress =
        this.config.solana.dialectProgramId;
    }
    if (this.config.solana?.rpcUrl) {
      internalConfig.rpcUrl = this.config.solana.rpcUrl;
    }
    return internalConfig;
  }
}
