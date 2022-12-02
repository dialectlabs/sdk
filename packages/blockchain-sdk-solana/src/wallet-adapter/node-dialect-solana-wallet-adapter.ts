import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import type { DialectSolanaWalletAdapter } from './dialect-solana-wallet-adapter.interface';
import nacl from 'tweetnacl';
import { convertKeyPair } from 'ed2curve';

export class NodeDialectSolanaWalletAdapter
  implements DialectSolanaWalletAdapter
{
  constructor(private readonly keypair: Keypair) {}

  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  static create(keypair?: Keypair) {
    if (keypair) {
      console.log(
        `Initializing ${
          NodeDialectSolanaWalletAdapter.name
        } using provided ${keypair.publicKey.toBase58()} key.`,
      );
      return new NodeDialectSolanaWalletAdapter(keypair);
    } else if (process.env.DIALECT_SDK_CREDENTIALS) {
      const privateKey = process.env.DIALECT_SDK_CREDENTIALS;
      const keypair: Keypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(privateKey as string)),
      );
      console.log(
        `Initializing ${
          NodeDialectSolanaWalletAdapter.name
        } using env-provided ${keypair.publicKey.toBase58()} key.`,
      );
      return new NodeDialectSolanaWalletAdapter(keypair);
    } else {
      throw new Error(
        `Error initializing ${NodeDialectSolanaWalletAdapter.name}: SDK credential must be provided.`,
      );
    }
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
