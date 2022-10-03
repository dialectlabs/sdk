import type {
  BlockchainSdk,
  BlockchainSdkFactory,
  Config,
  Environment,
} from '@dialectlabs/sdk';
import { EncryptionKeysProvider, IllegalArgumentError } from '@dialectlabs/sdk';
import type { DialectAptosWalletAdapter } from '../wallet-adapter/dialect-aptos-wallet-adapter.interface';
import { DialectAptosWalletAdapterWrapper } from '../wallet-adapter/dialect-aptos-wallet-adapter-wrapper';
import { DialectAptosWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import { AptosEd25519AuthenticationFacadeFactory } from '../auth/ed25519/aptos-ed25519-authentication-facade-factory';
import { DialectWalletAdapterAptosEd25519TokenSigner } from '../auth/ed25519/aptos-ed25519-token-signer';
import { AptosEd25519PayloadAuthenticationFacadeFactory } from '../auth/ed25519-payload/aptos-ed25519-payload-authentication-facade-factory';
import { DialectWalletAdapterAptosEd25519PayloadTokenSigner } from '../auth/ed25519-payload/aptos-ed25519-payload-token-signer';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_APTOS } from './constants';

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

  static create(props: AptosConfigProps) {
    return new AptosSdkFactory(props);
  }

  private static logConfiguration(
    config: AptosConfig,
    environment: Environment,
  ) {
    if (environment !== 'production') {
      console.log(
        `Initializing Dialect Aptos SDK using configuration:
Aptos settings:
  Wallet public key: ${config.wallet.publicKey}
  Wallet address: ${config.wallet.address}
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
    const authenticationFacade = this.initializeAuthenticationFacade(wallet);
    return {
      type: DIALECT_BLOCKCHAIN_SDK_TYPE_APTOS,
      info: {
        supportsOnChainMessaging: false,
      },
      encryptionKeysProvider,
      authenticationFacade,
      config: aptosConfig,
    };
  }

  private initializeAuthenticationFacade(
    wallet: DialectAptosWalletAdapterWrapper,
  ) {
    if (wallet.canSignMessage()) {
      return new AptosEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterAptosEd25519TokenSigner(wallet),
      ).get();
    }
    if (wallet.canSignMessagePayload()) {
      return new AptosEd25519PayloadAuthenticationFacadeFactory(
        new DialectWalletAdapterAptosEd25519PayloadTokenSigner(wallet),
      ).get();
    }
    throw new IllegalArgumentError(
      'Wallet does not support signing',
      'Wallet does not support signing',
    );
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
