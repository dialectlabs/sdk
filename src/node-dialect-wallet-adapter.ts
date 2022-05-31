import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import type { DialectWalletAdapter } from './dialect-wallet-adapter.interface';
import nacl from 'tweetnacl';
import { convertKeyPair } from 'ed2curve';

export class NodeDialectWalletAdapter implements DialectWalletAdapter {
  constructor(private readonly keypair: Keypair) {}

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  static create(keypair?: Keypair) {
    if (keypair) {
      console.log(
        `Initializing ${
          NodeDialectWalletAdapter.name
        } using provided ${keypair.publicKey.toBase58()} key.`,
      );
      return new NodeDialectWalletAdapter(keypair);
    }
    if (process.env.PRIVATE_KEY) {
      const privateKey = process.env.PRIVATE_KEY;
      const keypair: Keypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(privateKey as string)),
      );
      console.log(
        `Initializing ${
          NodeDialectWalletAdapter.name
        } using env-provided ${keypair.publicKey.toBase58()} key.`,
      );
      return new NodeDialectWalletAdapter(keypair);
    }
    const generated = Keypair.generate();
    console.log(
      `Initializing ${
        NodeDialectWalletAdapter.name
      } using generated ${generated.publicKey.toBase58()} key.`,
    );
    return new NodeDialectWalletAdapter(generated);
  }

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
