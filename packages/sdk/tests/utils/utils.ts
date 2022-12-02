
import { AptosSdkFactory, NodeDialectAptosWalletAdapter } from '@dialectlabs/blockchain-sdk-aptos';
import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import {
  Dialect,
  Environment,
} from '@dialectlabs/sdk';
import type { Keypair } from '@solana/web3.js';

export function createSolanaSdk(env?: Environment, keypair?: Keypair) {
  return Dialect.sdk(
    {
      environment: env,
    },
    SolanaSdkFactory.create({
      wallet: NodeDialectSolanaWalletAdapter.create(keypair),
    }),
  );
}

export function createAptosSdk(env?: Environment, privateKey?: Uint8Array) {
  return Dialect.sdk(
    {
      environment: env,
    },
    AptosSdkFactory.create({
      wallet: NodeDialectAptosWalletAdapter.create(privateKey),
    }),
  );
}