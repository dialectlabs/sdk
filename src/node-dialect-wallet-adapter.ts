import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import type { DialectWalletAdapter } from './dialect-wallet-adapter';
import nacl from 'tweetnacl';
import { convertKeyPair } from 'ed2curve';

export class EmbeddedDialectWalletAdapter implements DialectWalletAdapter {
  static create(keypair?: Keypair) {
    if (keypair) {
      console.log(
        `Initializing ${
          EmbeddedDialectWalletAdapter.name
        } using provided ${keypair.publicKey.toBase58()} key.`,
      );
      return new EmbeddedDialectWalletAdapter(keypair);
    }
    if (process.env.PRIVATE_KEY) {
      const privateKey = process.env.PRIVATE_KEY;
      const keypair: Keypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(privateKey as string)),
      );
      console.log(
        `Initializing ${
          EmbeddedDialectWalletAdapter.name
        } using env-provided ${keypair.publicKey.toBase58()} key.`,
      );
      return new EmbeddedDialectWalletAdapter(keypair);
    }
    const generated = Keypair.generate();
    console.log(
      `Initializing ${
        EmbeddedDialectWalletAdapter.name
      } using generated ${generated.publicKey.toBase58()} key.`,
    );
    return new EmbeddedDialectWalletAdapter(generated);
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
    return Promise.resolve(nacl.sign.detached(message, this.keypair.secretKey));
  }

  diffieHellman(
    publicKey: Uint8Array,
  ): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    const keypair = convertKeyPair({
      secretKey: this.keypair.secretKey,
      publicKey,
    });
    if (!keypair) {
      throw new Error('Failed to convert keypair');
    }
    return Promise.resolve(keypair);
  }
}
