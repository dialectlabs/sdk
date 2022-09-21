import { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type { Program } from '@project-serum/anchor';
import { createDialectProgram } from '../messaging/solana-dialect-program-factory';
import { PublicKey } from '@solana/web3.js';
import { programs } from '@dialectlabs/web3';
import type {
  BlockchainFactory,
  BlockchainSdk,
  Config,
  Environment,
  SolanaNetwork,
} from '../../core/sdk/sdk.interface';
import type { DialectSolanaWalletAdapter } from '../wallet-adapter/dialect-solana-wallet-adapter.interface';
import { DialectWalletAdapterEncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import { EncryptionKeysProvider } from '../../core/internal/encryption/encryption-keys-provider';
import { SolanaEd25519AuthenticationFacadeFactory } from '../auth/ed25519/solana-ed25519-authentication-facade-factory';
import { DialectWalletAdapterEd25519TokenSigner } from '../auth/ed25519/solana-ed25519-token-signer';
import { SolanaTxAuthenticationFacadeFactory } from '../auth/solana-tx/solana-tx-authentication-facade-factory';
import { DialectWalletAdapterSolanaTxTokenSigner } from '../auth/solana-tx/solana-tx-token-signer';
import { SolanaMessaging } from '../messaging/solana-messaging';
import { SolanaDappAddresses } from '../dapp/solana-dapp-addresses';
import { SolanaDappMessages } from '../dapp/solana-dapp-messages';

export interface SolanaConfigProps {
  wallet: DialectSolanaWalletAdapter;
  network?: SolanaNetwork;
  dialectProgramAddress?: PublicKey;
  rpcUrl?: string;
}

export interface SolanaConfig extends SolanaConfigProps {
  wallet: DialectSolanaWalletAdapterWrapper;
  network: SolanaNetwork;
  dialectProgramAddress: PublicKey;
  rpcUrl: string;
}

export class SolanaBlockchainFactory implements BlockchainFactory {
  constructor(private readonly solanaConfigProps: SolanaConfigProps) {}

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
  Dialect program: ${config.dialectProgramAddress}
  RPC URL: ${config.rpcUrl}
`,
      );
    }
  }

  create(config: Config): BlockchainSdk {
    const solanaConfig = this.initializeSolanaConfig(
      config.environment,
      this.solanaConfigProps,
    );
    const wallet = solanaConfig.wallet;
    SolanaBlockchainFactory.logConfiguration(solanaConfig, config.environment);
    const dialectProgram: Program = createDialectProgram(
      wallet,
      solanaConfig.dialectProgramAddress,
      solanaConfig.rpcUrl,
    );
    const walletAdapterEncryptionKeysProvider =
      new DialectWalletAdapterEncryptionKeysProvider(wallet);
    const encryptionKeysProvider = EncryptionKeysProvider.create(
      walletAdapterEncryptionKeysProvider,
      config.encryptionKeysStore,
    );
    const authenticationFacadeFactory = wallet.canSignMessage()
      ? new SolanaEd25519AuthenticationFacadeFactory(
          new DialectWalletAdapterEd25519TokenSigner(wallet),
        )
      : new SolanaTxAuthenticationFacadeFactory(
          new DialectWalletAdapterSolanaTxTokenSigner(wallet),
        );

    const solanaDappAddresses = new SolanaDappAddresses(dialectProgram);
    const dappMessages = new SolanaDappMessages(
      new SolanaMessaging(wallet, dialectProgram, encryptionKeysProvider),
      solanaDappAddresses,
    );
    const dappAddresses = new SolanaDappAddresses(dialectProgram);
    const authenticationFacade = authenticationFacadeFactory.get();
    const messaging = new SolanaMessaging(
      wallet,
      dialectProgram,
      encryptionKeysProvider,
    );

    return {
      type: 'solana',
      messaging,
      encryptionKeysProvider,
      dappMessages,
      dappAddresses,
      authenticationFacade,
    };
  }

  static create(props: SolanaConfigProps) {
    return new SolanaBlockchainFactory(props);
  }

  private initializeSolanaConfig(
    environment: Environment,
    solanaConfigProps: SolanaConfigProps,
  ): SolanaConfig {
    const wallet = new DialectSolanaWalletAdapterWrapper(
      this.solanaConfigProps.wallet,
    );
    let config: SolanaConfig = {
      wallet,
      network: 'mainnet-beta',
      dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
      rpcUrl: programs.mainnet.clusterAddress,
    };
    if (environment === 'production') {
      const network = 'mainnet-beta';
      config = {
        wallet,
        network,
        dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
        rpcUrl: programs.mainnet.clusterAddress,
      };
    }
    if (environment === 'development') {
      const network = 'devnet';
      config = {
        wallet,
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }
    if (environment === 'local-development') {
      const network = 'localnet';
      config = {
        wallet,
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }
    const solanaNetwork = solanaConfigProps?.network;
    if (solanaNetwork === 'mainnet-beta') {
      const network = 'mainnet-beta';
      config = {
        wallet,
        network,
        dialectProgramAddress: new PublicKey(programs.mainnet.programAddress),
        rpcUrl: programs.mainnet.clusterAddress,
      };
    }
    if (solanaNetwork === 'devnet') {
      const network = 'devnet';
      config = {
        wallet,
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }
    if (solanaNetwork === 'localnet') {
      const network = 'localnet';
      config = {
        wallet,
        network,
        dialectProgramAddress: new PublicKey(programs[network].programAddress),
        rpcUrl: programs[network].clusterAddress,
      };
    }

    if (solanaConfigProps?.dialectProgramAddress) {
      config.dialectProgramAddress = solanaConfigProps.dialectProgramAddress;
    }
    if (solanaConfigProps?.rpcUrl) {
      config.rpcUrl = solanaConfigProps.rpcUrl;
    }
    return config;
  }
}
