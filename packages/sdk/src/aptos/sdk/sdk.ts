import type {
  BlockchainSdk,
  BlockchainSdkFactory,
  Config,
  Environment,
} from '../../core/sdk/sdk.interface';
import { EncryptionKeysProvider } from '../../core/internal/encryption/encryption-keys-provider';
import type { DialectAptosWalletAdapter } from '../wallet-adapter/dialect-aptos-wallet-adapter.interface';
import { DialectAptosWalletAdapterWrapper } from '../wallet-adapter/dialect-aptos-wallet-adapter-wrapper';
import { DialectAptosWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import { AptosEd25519AuthenticationFacadeFactory } from '../auth/ed25519/aptos-ed25519-authentication-facade-factory';
import { DialectWalletAdapterAptosEd25519TokenSigner } from '../auth/ed25519/aptos-ed25519-token-signer';

export interface AptosConfigProps {
  wallet: DialectAptosWalletAdapter;
}

export interface AptosConfig extends AptosConfigProps {
  wallet: DialectAptosWalletAdapterWrapper;
}

export interface Aptos extends BlockchainSdk {
  readonly config: AptosConfig;
}

export class AptosSdkFactory implements BlockchainSdkFactory<Aptos> {
  private constructor(readonly aptosConfigProps: AptosConfigProps) {}

  private static logConfiguration(
    config: AptosConfig,
    environment: Environment,
  ) {
    if (environment !== 'production') {
      console.log(
        `Initializing Dialect Aptos SDK using configuration:
Aptos settings:
  Wallet public key: ${config.wallet.publicAccount.publicKey}
  Wallet address: ${config.wallet.publicAccount.address}
`,
      );
    }
  }

  create(config: Config): Aptos {
    const aptosConfig = this.initializeAptosConfig();
    AptosSdkFactory.logConfiguration(aptosConfig, config.environment);
    const wallet = aptosConfig.wallet;
    const walletAdapterEncryptionKeysProvider =
      new DialectAptosWalletAdapterEncryptionKeysProvider(wallet);
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      walletAdapterEncryptionKeysProvider,
      config.encryptionKeysStore,
    );
    const authenticationFacadeFactory =
      new AptosEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterAptosEd25519TokenSigner(wallet),
      );
    const authenticationFacade = authenticationFacadeFactory.get();
    return {
      type: 'aptos',
      encryptionKeysProvider,
      authenticationFacade,
      config: aptosConfig,
    };
  }

  static create(props: AptosConfigProps) {
    return new AptosSdkFactory(props);
  }

  private initializeAptosConfig(): AptosConfig {
    const wallet = new DialectAptosWalletAdapterWrapper(
      this.aptosConfigProps.wallet,
    );
    return {
      wallet,
    };
  }
}
