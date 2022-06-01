import type { EncryptionProps } from '@dialectlabs/web3';
import type { DialectWalletAdapterImpl } from '@wallet-adapter/internal/dialect-wallet-adapter-impl';

export async function getEncryptionProps(
  encrypted: boolean,
  walletAdapter: DialectWalletAdapterImpl,
): Promise<EncryptionProps | undefined> {
  if (encrypted && walletAdapter.canEncrypt()) {
    return {
      diffieHellmanKeyPair: await walletAdapter.diffieHellman(),
      ed25519PublicKey: walletAdapter.publicKey.toBytes(),
    };
  }
}
