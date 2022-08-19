import { Connection } from '@solana/web3.js';
import { Idl, Program, Provider } from '@project-serum/anchor';
import { idl } from '@dialectlabs/web3';
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type { WalletAddress } from '@wallet/internal/wallet-address';

export function createDialectProgram(
  walletAdapter: DialectWalletAdapterWrapper,
  dialectProgramAddress: WalletAddress,
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
