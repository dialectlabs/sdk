import type {
  BlockchainSdk,
  BlockchainSdkFactory,
  Config,
  Environment,
} from '@dialectlabs/sdk';
import { EncryptionKeysProvider, IllegalArgumentError } from '@dialectlabs/sdk';
import type { DialectEvmWalletAdapter } from '../wallet-adapter/dialect-evm-wallet-adapter.interface';
import { DialectEvmWalletAdapterWrapper } from '../wallet-adapter/dialect-evm-wallet-adapter-wrapper';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_EVM } from './constants';

import { EvmEd25519AuthenticationFacadeFactory } from '../auth/evm-ed25519-authentication-facade-factory';
import { DialectWalletAdapterEvmEd25519TokenSigner } from '../auth/evm-ed25519-token-signer';
import { DialectEvmWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';

export interface EvmConfigProps {
  wallet: DialectEvmWalletAdapter;
}

export interface EvmConfig extends EvmConfigProps {
  wallet: DialectEvmWalletAdapterWrapper;
}

export interface Evm extends BlockchainSdk {
  readonly config: EvmConfig;
}

export class EvmSdkFactory implements BlockchainSdkFactory<Evm> {
  private constructor(readonly evmConfigProps: EvmConfigProps) {}

  private static logConfiguration(config: EvmConfig, environment: Environment) {
    if (environment !== 'production') {
      console.log(
        `Initializing Dialect EVM SDK using configuration:
        EVM settings:
          Wallet address: ${config.wallet.address}
        `,
      );
    }
  }

  create(config: Config): Evm {
    const evmConfig = this.initializeEvmConfig();
    EvmSdkFactory.logConfiguration(evmConfig, config.environment);

    const wallet = evmConfig.wallet;
    const walletAdapterEncryptionKeysProvider =
      new DialectEvmWalletAdapterEncryptionKeysProvider(wallet);
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      walletAdapterEncryptionKeysProvider,
      config.encryptionKeysStore,
    );
    const authenticationFacade = this.initializeAuthenticationFacade(wallet);
    return {
      type: DIALECT_BLOCKCHAIN_SDK_TYPE_EVM,
      info: {
        supportsOnChainMessaging: false,
      },
      encryptionKeysProvider,
      authenticationFacade,
      config: evmConfig,
    };
  }

  private initializeAuthenticationFacade(
    wallet: DialectEvmWalletAdapterWrapper,
  ) {
    if (wallet.canSignMessage()) {
      return new EvmEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterEvmEd25519TokenSigner(wallet),
      ).get();
    }
    throw new IllegalArgumentError('Wallet does not support signing');
  }

  static create(props: EvmConfigProps) {
    return new EvmSdkFactory(props);
  }

  private initializeEvmConfig(): EvmConfig {
    const wallet = new DialectEvmWalletAdapterWrapper(
      this.evmConfigProps.wallet,
    );
    return {
      wallet,
    };
  }
}
