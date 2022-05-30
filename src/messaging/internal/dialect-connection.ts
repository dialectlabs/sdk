import { Connection, PublicKey } from '@solana/web3.js';
import { Idl, Program, Provider } from '@project-serum/anchor';
import { idl, programs } from '@dialectlabs/web3';
import type { DialectWalletAdapterDecorator } from '../../internal/dialect-wallet-adapter';

export function createDialectProgram(
  walletAdapter: DialectWalletAdapterDecorator,
): Program {
  const RPC_URL = process.env.RPC_URL || 'http://localhost:8899';
  console.log('RPC url', RPC_URL);
  const dialectConnection = new Connection(RPC_URL, {
    commitment: 'recent',
  });
  const dialectProvider = new Provider(
    dialectConnection,
    walletAdapter,
    Provider.defaultOptions(),
  );
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const NETWORK_NAME: 'devnet' | 'localnet' =
    process.env.NETWORK_NAME ?? 'localnet';
  console.log('Network name', NETWORK_NAME);
  const DIALECT_PROGRAM_ADDRESS = programs[NETWORK_NAME].programAddress;
  return new Program(
    idl as Idl,
    new PublicKey(DIALECT_PROGRAM_ADDRESS),
    dialectProvider,
  );
}
