import type { MessagingFacade } from './messaging/messaging-facade';
import type { Dapps, Wallets } from './dapp/dapps';
import type { DialectWalletAdapter } from './wallet-interfaces';
import type { PublicKey } from '@solana/web3.js';
import type { TokenStore } from './data-service-api/token';

export interface SupportedApi {
  encryption: boolean;
  offChainMessaging: boolean;
  onChainMessaging: boolean;
}

export class DialectSDK {
  constructor(
    readonly config: Config,
    readonly dialects: MessagingFacade,
    readonly wallet: Wallets,
    readonly dapps: Dapps,
  ) {}

  supportedApi(): SupportedApi {
    return {
      encryption: true,
      offChainMessaging: true,
      onChainMessaging: false,
    };
  }

  static create(config: Config): DialectSDK {
    throw new Error('Not implemented');
  }
}

export type Environment = 'production' | 'development' | 'local-development';

export interface Config {
  environment?: Environment;
  wallet: DialectWalletAdapter;
  web3?: Web3Config;
  web2?: Web2Config;
}

export interface Web3Config {
  network?: Web3Network;
  programId?: PublicKey;
  rpcUrl?: string;
}

export interface Web3Config {
  network?: Web3Network;
  programId?: PublicKey;
}

export type Web3Network = 'mainnet-beta' | 'devnet' | 'localnet';

export interface Web2Config {
  dialectCloudUrl?: string;
  tokenStore?: TokenStore;
}
