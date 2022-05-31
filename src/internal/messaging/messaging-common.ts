import type { InternalDialectWalletAdapter } from '../wallet-adapter/internal-dialect-wallet-adapter';
import type { EncryptionProps } from '@dialectlabs/web3';

export async function getEncryptionProps(
  encrypted: boolean,
  walletAdapter: InternalDialectWalletAdapter,
): Promise<EncryptionProps | undefined> {
  if (encrypted && walletAdapter.canEncrypt()) {
    return {
      diffieHellmanKeyPair: await walletAdapter.diffieHellman(),
      ed25519PublicKey: walletAdapter.publicKey.toBytes(),
    };
  }
}
