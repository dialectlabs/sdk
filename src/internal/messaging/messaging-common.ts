import type { EncryptionProps } from '@dialectlabs/web3';
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/internal/dialect-wallet-adapter-wrapper';

export async function getEncryptionProps(
  encrypted: boolean,
  walletAdapter: DialectWalletAdapterWrapper,
): Promise<EncryptionProps | undefined> {
  if (encrypted && walletAdapter.canEncrypt()) {
    return {
      diffieHellmanKeyPair: await walletAdapter.diffieHellman(),
      ed25519PublicKey: walletAdapter.publicKey.toBytes(),
    };
  }
}
