import { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type { Program } from '@project-serum/anchor';
import { createDialectProgram } from '../messaging/solana-dialect-program-factory';
import { PublicKey } from '@solana/web3.js';
import { programs } from '@dialectlabs/web3';
import type {
  BlockchainSdk,
  BlockchainSdkFactory,
  Config,
  Environment,
} from '@dialectlabs/sdk';
import { EncryptionKeysProvider } from '@dialectlabs/sdk';
import type { DialectSolanaWalletAdapter } from '../wallet-adapter/dialect-solana-wallet-adapter.interface';
import { DialectSolanaWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import { SolanaMessaging } from '../messaging/solana-messaging';
import { SolanaDappAddresses } from '../dapp/solana-dapp-addresses';
import { SolanaDappMessages } from '../dapp/solana-dapp-messages';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA } from './constants';
import { SolanaAuthenticationFacadeFactory } from '../auth/solana-authentication-facade-factory';

export interface SolanaConfigProps {
  wallet: DialectSolanaWalletAdapter;
  network?: SolanaNetwork;
  dialectProgramAddress?: PublicKey;
  rpcUrl?: string;
  enableOnChainMessaging?: boolean;
}

export interface SolanaConfig extends SolanaConfigProps {
  wallet: DialectSolanaWalletAdapterWrapper;
  network: SolanaNetwork;
  dialectProgramAddress: PublicKey;
  rpcUrl: string;
  enableOnChainMessaging: boolean;
}

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'localnet';

export interface Solana extends BlockchainSdk {
  readonly config: SolanaConfig;
  readonly dialectProgram: Program;
}

export class SolanaSdkFactory implements BlockchainSdkFactory<Solana> {
  private constructor(readonly solanaConfigProps: SolanaConfigProps) {}

  static create(props: SolanaConfigProps) {
    return new SolanaSdkFactory(props);
  }

  private static logConfiguration(
    config: SolanaConfig,
    environment: Environment,
  ) {
    if (environment !== 'production') {
      console.log(
        `Initializing Dialect Solana SDK using configuration:
Solana settings:
  On-chain messaging enabled: ${config.enableOnChainMessaging}
  Wallet public key: ${config.wallet.publicKey}
  Wallet supports encryption: ${config.wallet.canEncrypt}
  Wallet supports authentication: ${
    config.wallet.canSignMessage() || config.wallet.canSignTransaction()
  }
  Dialect program: ${config.dialectProgramAddress}
  RPC URL: ${config.rpcUrl}
`,
      );
    }
  }

  create(config: Config): Solana {
    const solanaConfig = this.initializeSolanaConfig(
      config.environment,
      this.solanaConfigProps,
    );
    const wallet = solanaConfig.wallet;
    SolanaSdkFactory.logConfiguration(solanaConfig, config.environment);
    const dialectProgram: Program = createDialectProgram(
      wallet,
      solanaConfig.dialectProgramAddress,
      solanaConfig.rpcUrl,
    );
    const walletAdapterEncryptionKeysProvider =
      new DialectSolanaWalletAdapterEncryptionKeysProvider(wallet);
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      walletAdapterEncryptionKeysProvider,
      config.encryptionKeysStore,
    );

    const authenticationFacadeFactory = new SolanaAuthenticationFacadeFactory(
      config,
      wallet,
    ).create();
    const authenticationFacade = authenticationFacadeFactory.get();

    const onChainMessagingFactory = () => {
      const dappAddresses = new SolanaDappAddresses(dialectProgram);
      const messaging = new SolanaMessaging(
        wallet,
        dialectProgram,
        encryptionKeysProvider,
      );
      return {
        messaging,
        dappMessages: new SolanaDappMessages(
          new SolanaMessaging(wallet, dialectProgram, encryptionKeysProvider),
          dappAddresses,
        ),
        dappAddresses,
      };
    };
    return {
      type: DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA,
      encryptionKeysProvider,
      authenticationFacade,
      config: solanaConfig,
      dialectProgram,
      ...(solanaConfig.enableOnChainMessaging && onChainMessagingFactory()),
      info: {
        supportsOnChainMessaging: solanaConfig.enableOnChainMessaging,
      },
    };
  }

  private initializeSolanaConfig(
    environment: Environment,
    solanaConfigProps: SolanaConfigProps,
  ): SolanaConfig {
    const wallet = new DialectSolanaWalletAdapterWrapper(
      this.solanaConfigProps.wallet,
    );
    const base: SolanaConfig = {
      wallet,
      network: 'mainnet-beta',
      dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
      rpcUrl: programs.mainnet.clusterAddress,
      enableOnChainMessaging: false,
    };
    switch (environment) {
      case 'production': {
        base.network = 'mainnet-beta';
        base.dialectProgramAddress = new PublicKey(
          programs.mainnet.programAddress,
        );
        base.rpcUrl = programs.mainnet.clusterAddress;
        break;
      }
      case 'development': {
        const network = 'devnet';
        base.network = network;
        base.dialectProgramAddress = new PublicKey(
          programs[network].programAddress,
        );
        base.rpcUrl = programs[network].clusterAddress;
        break;
      }
      case 'local-development': {
        const network = 'localnet';
        base.network = network;
        base.dialectProgramAddress = new PublicKey(
          programs[network].programAddress,
        );
        base.rpcUrl = programs[network].clusterAddress;
        break;
      }
    }
    const solanaNetwork = solanaConfigProps?.network;
    switch (solanaNetwork) {
      case 'mainnet-beta': {
        base.network = 'mainnet-beta';
        base.dialectProgramAddress = new PublicKey(
          programs.mainnet.programAddress,
        );
        base.rpcUrl = programs.mainnet.clusterAddress;
        break;
      }
      case 'devnet': {
        const network = 'devnet';
        base.network = network;
        base.dialectProgramAddress = new PublicKey(
          programs[network].programAddress,
        );
        base.rpcUrl = programs[network].clusterAddress;
        break;
      }
      case 'localnet': {
        const network = 'localnet';
        base.network = network;
        base.dialectProgramAddress = new PublicKey(
          programs[network].programAddress,
        );
        base.rpcUrl = programs[network].clusterAddress;
        break;
      }
    }
    if (solanaConfigProps?.dialectProgramAddress) {
      base.dialectProgramAddress = solanaConfigProps.dialectProgramAddress;
    }
    if (solanaConfigProps?.rpcUrl) {
      base.rpcUrl = solanaConfigProps.rpcUrl;
    }
    if (solanaConfigProps?.enableOnChainMessaging) {
      base.enableOnChainMessaging = solanaConfigProps.enableOnChainMessaging;
    }
    return base;
  }
}
