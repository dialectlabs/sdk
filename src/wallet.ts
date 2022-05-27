import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import type {
  EncryptionKeyProviderWalletAdapterProps,
  Web2Wallet,
  Web3Wallet,
} from './wallet-interfaces';
import nacl from 'tweetnacl';
import { convertKeyPair } from 'ed2curve';

export class EmbeddedWalletAdapter
  implements Web2Wallet, Web3Wallet, EncryptionKeyProviderWalletAdapterProps
{
  static create(keypair?: Keypair) {
    if (!keypair) {
      return new EmbeddedWalletAdapter(Keypair.generate());
    }
    return new EmbeddedWalletAdapter(keypair);
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
