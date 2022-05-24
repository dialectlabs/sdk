import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import type {
  EncryptionKeyProviderWalletAdapterProps,
  Web2Wallet,
  Web3Wallet,
} from './wallet-interfaces';
import { ed25519KeyPairToCurve25519 } from '@dialectlabs/web3/lib/types/utils/ecdh-encryption';

export class EmbeddedWallet
  implements Web2Wallet, Web3Wallet, EncryptionKeyProviderWalletAdapterProps
{
  static create(keypair?: Keypair) {
    if (!keypair) {
      return new EmbeddedWallet(Keypair.generate());
    }
    return new EmbeddedWallet(keypair);
  }

  constructor(private readonly keypair: Keypair) {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    tx.partialSign(this.keypair);
    return tx;
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs.map((t) => {
      t.partialSign(this.keypair);
      return t;
    });
  }

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  signMessage(message: Uint8Array): Promise<Uint8Array> {
    return Promise.resolve(message); // TODO: implement
  }

  diffieHellman(
    publicKey: Uint8Array,
  ): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    return Promise.resolve(
      ed25519KeyPairToCurve25519({
        publicKey,
        secretKey: this.keypair.secretKey,
      }),
    );
  }
}
