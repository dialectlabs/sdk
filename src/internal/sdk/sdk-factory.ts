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
import {
  DataServiceApi,
  DataServiceDappsApi,
  DataServiceDialectsApi,
} from '@data-service-api/data-service-api';
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
import type { DappAddresses, Dapps } from '@dapp/dapp.interface';
import type { Program } from '@project-serum/anchor';
import { DappsImpl } from '@dapp/internal/dapp';
import { DappAddressesFacade } from '@dapp/internal/dapp-addresses-facade';
import { SolanaDappAddresses } from '@dapp/internal/solana-dapp-addresses';
import { DataServiceDappAddresses } from '@dapp/internal/data-service-dapp-addresses';

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
  constructor(
    readonly info: DialectSdkInfo,
    readonly threads: Messaging,
    readonly dapps: Dapps,
  ) {}
}

export class DialectSdkFactory {
  constructor(private readonly config: Config) {}

  create(): DialectSdk {
    const config: InternalConfig = this.initializeConfig();
    DialectSdkFactory.logConfiguration(config);
    const encryptionKeysProvider =
      new DialectWalletAdapterEncryptionKeysProvider(config.wallet);

    const dialectProgram: Program = createDialectProgram(
      config.wallet,
      config.solana.dialectProgramAddress,
      config.solana.rpcUrl,
    );
    const dataServiceApi: DataServiceApi = DataServiceApi.create(
      config.dialectCloud.url,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(config.wallet),
        Duration.fromObject({ minutes: 60 }),
        config.dialectCloud.tokenStore,
      ),
    );
    const messaging = this.createMessaging(
      config,
      encryptionKeysProvider,
      dialectProgram,
      dataServiceApi.threads,
    );

    const dapps = this.createDapps(
      config,
      dialectProgram,
      dataServiceApi.dapps,
    );
    return new InternalDialectSdk(
      {
        apiAvailability: config.wallet,
        config,
        wallet: config.wallet,
        solana: {
          dialectProgram,
        },
      },
      messaging,
      dapps,
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
    encryptionKeysProvider: DialectWalletAdapterEncryptionKeysProvider,
    program: Program,
    dataServiceDialectsApi: DataServiceDialectsApi,
  ) {
    const messagingBackends: Messaging[] = config.backends.map((backend) => {
      switch (backend) {
        case Backend.Solana:
          return new SolanaMessaging(
            config.wallet,
            program,
            encryptionKeysProvider,
          );
        case Backend.DialectCloud:
          return new DataServiceMessaging(
            config.wallet.publicKey,
            dataServiceDialectsApi,
            encryptionKeysProvider,
          );
        default:
          throw new IllegalArgumentError(`Unknown backend ${backend}`);
      }
    });
    return new MessagingFacade(messagingBackends);
  }

  private createDapps(
    config: InternalConfig,
    program: Program,
    dataServiceDappsApi: DataServiceDappsApi,
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
    const dappAddressesFacade = new DappAddressesFacade(dappAddressesBackends);
    return new DappsImpl(config.wallet.publicKey, dappAddressesFacade);
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
      return [Backend.DialectCloud, Backend.Solana];
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
