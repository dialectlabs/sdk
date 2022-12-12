import type { BlockchainSdkFactory, BlockchainSdk, Config, Environment } from '@dialectlabs/sdk';
import type { DialectEvmWalletAdapter } from '../wallet-adapter/dialect-evm-wallet-adapter.interface';
import { DialectEvmWalletAdapterWrapper } from '../wallet-adapter/dialect-evm-wallet-adapter-wrapper';
import { EncryptionKeysProvider, IllegalArgumentError } from '@dialectlabs/sdk';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_EVM } from './constants';

import { EvmEd25519AuthenticationFacadeFactory } from '../auth/evm-ed25519-authentication-facade-factory';
import { DialectWalletAdapterEvmEd25519TokenSigner } from '../auth/evm-ed25519-token-signer';
import { DialectEvmWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';

export interface PolygonConfigProps {
  wallet: DialectEvmWalletAdapter;
}

export interface PolygonConfig extends PolygonConfigProps {
  wallet: DialectEvmWalletAdapterWrapper;
}

export interface Polygon extends BlockchainSdk {
  readonly config: PolygonConfig;
}

export class PolygonSdkFactory implements BlockchainSdkFactory<Polygon> {
  private constructor(readonly polygoncConfigProps: PolygonConfigProps) { }


  private static logConfiguration(
    config: PolygonConfig,
    environment: Environment,
  ) {
    if (environment !== 'production') {
      console.log(
        `Initializing Dialect Aptos SDK using configuration:
        EVM settings:
          Wallet address: ${config.wallet.address}
        `,
      );
    }
  }
  create(config: Config): Polygon {
    const polygonConfig = this.initializePolygonConfig();
    PolygonSdkFactory.logConfiguration(polygonConfig, config.environment);

    const wallet = polygonConfig.wallet;
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
      config: polygonConfig,
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
    if (wallet.canSignTransaction()) {
      return new EvmEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterEvmEd25519TokenSigner(wallet),
      ).get();
    }
    throw new IllegalArgumentError(
      'Wallet does not support signing',
      'Wallet does not support signing',
    );
  }

  static create(props: PolygonConfigProps) {
    return new PolygonSdkFactory(props);
  }

  private initializePolygonConfig(): PolygonConfig {
    const wallet = new DialectEvmWalletAdapterWrapper(
      this.polygoncConfigProps.wallet,
    );
    return {
      wallet,
    };
  }
}
