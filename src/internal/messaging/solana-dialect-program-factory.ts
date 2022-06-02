import { Connection, PublicKey } from '@solana/web3.js';
import { Idl, Program, Provider } from '@project-serum/anchor';
import { idl } from '@dialectlabs/web3';
import type { DialectWalletAdapterImpl } from '@wallet-adapter/internal/dialect-wallet-adapter-impl';

export function createDialectProgram(
  walletAdapter: DialectWalletAdapterImpl,
  dialectProgramAddress: PublicKey,
  rpcUrl: string,
): Program {
  const dialectConnection = new Connection(rpcUrl, {
    commitment: 'recent',
  });
  const dialectProvider = new Provider(
    dialectConnection,
    walletAdapter,
    Provider.defaultOptions(),
  );
  return new Program(idl as Idl, dialectProgramAddress, dialectProvider);
}
