import { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type {
  BlockchainSdk,
  BlockchainSdkFactory,
  Config,
  Environment,
} from '@dialectlabs/sdk';
import { EncryptionKeysProvider } from '@dialectlabs/sdk';
import type { DialectSolanaWalletAdapter } from '../wallet-adapter/dialect-solana-wallet-adapter.interface';
import { DialectSolanaWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import { SolanaEd25519AuthenticationFacadeFactory } from '../auth/ed25519/solana-ed25519-authentication-facade-factory';
import { DialectWalletAdapterSolanaEd25519TokenSigner } from '../auth/ed25519/solana-ed25519-token-signer';
import { SolanaTxAuthenticationFacadeFactory } from '../auth/tx/solana-tx-authentication-facade-factory';
import { DialectWalletAdapterSolanaTxTokenSigner } from '../auth/tx/solana-tx-token-signer';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA } from './constants';

export interface SolanaConfigProps {
  wallet: DialectSolanaWalletAdapter;
}

export interface SolanaConfig extends SolanaConfigProps {
  wallet: DialectSolanaWalletAdapterWrapper;
}

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'localnet';

export interface Solana extends BlockchainSdk {
  readonly config: SolanaConfig;
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
  Wallet public key: ${config.wallet.publicKey}
  Wallet supports encryption: ${config.wallet.canEncrypt}
  Wallet supports authentication: ${
    config.wallet.canSignMessage() || config.wallet.canSignTransaction()
  }
`,
      );
    }
  }

  create(config: Config): Solana {
    const solanaConfig = this.initializeSolanaConfig();
    const wallet = solanaConfig.wallet;
    SolanaSdkFactory.logConfiguration(solanaConfig, config.environment);
    const walletAdapterEncryptionKeysProvider =
      new DialectSolanaWalletAdapterEncryptionKeysProvider(wallet);
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      walletAdapterEncryptionKeysProvider,
      config.encryptionKeysStore,
    );
    const authenticationFacadeFactory = wallet.canSignMessage()
      ? new SolanaEd25519AuthenticationFacadeFactory(
          new DialectWalletAdapterSolanaEd25519TokenSigner(wallet),
        )
      : new SolanaTxAuthenticationFacadeFactory(
          new DialectWalletAdapterSolanaTxTokenSigner(wallet),
        );
    const authenticationFacade = authenticationFacadeFactory.get();

    return {
      type: DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA,
      encryptionKeysProvider,
      authenticationFacade,
      config: solanaConfig,
      info: {
        supportsOnChainMessaging: false,
      },
    };
  }

  private initializeSolanaConfig(): SolanaConfig {
    const wallet = new DialectSolanaWalletAdapterWrapper(
      this.solanaConfigProps.wallet,
    );
    return {
      wallet,
    };
  }
}
