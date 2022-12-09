import type { BlockchainSdkFactory, BlockchainSdk, Config, Environment } from '@dialectlabs/sdk';
import type { DialectPolygonWalletAdapter } from '../../wallet-adapter/dialect-polygon-wallet-adapter.interface';
import { DialectPolygonWalletAdapterWrapper } from '../../wallet-adapter/dialect-polygon-wallet-adapter-wrapper';
import { EncryptionKeysProvider, IllegalArgumentError } from '@dialectlabs/sdk';
import { DialectWalletAdapterPolygonEd25519TokenSigner } from '../../auth/polygon-ed25519-token-signer';
import { PolygonEd25519AuthenticationFacadeFactory } from '../../auth/polygon-ed25519-authentication-facade-factory';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_POLYGON } from './constant';
import { DialectPolygonWalletAdapterEncryptionKeysProvider } from "../../encryption/encryption-keys-provider"

export interface PolygonConfigProps {
  wallet: DialectPolygonWalletAdapter;
}

export interface PolygonConfig extends PolygonConfigProps {
  wallet: DialectPolygonWalletAdapterWrapper;
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
      new DialectPolygonWalletAdapterEncryptionKeysProvider(wallet);
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      walletAdapterEncryptionKeysProvider,
      config.encryptionKeysStore,
    );
    const authenticationFacade = this.initializeAuthenticationFacade(wallet);
    return {
      type: DIALECT_BLOCKCHAIN_SDK_TYPE_POLYGON,
      info: {
        supportsOnChainMessaging: false,
      },
      encryptionKeysProvider,
      authenticationFacade,
      config: polygonConfig,
    };
  }

  private initializeAuthenticationFacade(
    wallet: DialectPolygonWalletAdapterWrapper,
  ) {
    if (wallet.canSignMessage()) {
      return new PolygonEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterPolygonEd25519TokenSigner(wallet),
      ).get();
    }
    if (wallet.canSignTransaction()) {
      return new PolygonEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterPolygonEd25519TokenSigner(wallet),
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
    const wallet = new DialectPolygonWalletAdapterWrapper(
      this.polygoncConfigProps.wallet,
    );
    return {
      wallet,
    };
  }
}
