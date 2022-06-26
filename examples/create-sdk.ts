import { Keypair } from '@solana/web3.js';
import {
    Backend,
    ConfigProps,
    Dialect,
    DialectSdk,
    DialectWalletAdapterWrapper,
    EncryptionKeysStore,
    NodeDialectWalletAdapter,
    TokenStore
  } from '../src';

export function createSdk(): DialectSdk {
  // let secretKey: Uint8Array;
  // secretKey = new Uint8Array([...]);
  // console.log({secretKey});

  const backends = [Backend.DialectCloud, Backend.Solana];
  const dialectCloud = {
    url: 'https://dialectapi.to',
    tokenStore: TokenStore.createInMemory(),
  };
  const environment = 'production';
  const encryptionKeysStore = EncryptionKeysStore.createInMemory();
  const solana = {
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  };
  // const keypair = Keypair.fromSecretKey(secretKey);
  const wallet = DialectWalletAdapterWrapper.create(
    NodeDialectWalletAdapter.create(),
  );

  const sdk: DialectSdk = Dialect.sdk({
    backends,
    dialectCloud,
    environment,
    encryptionKeysStore,
    solana,
    wallet,
  } as ConfigProps);

  return sdk;
}

createSdk();
