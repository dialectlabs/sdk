import {
  PublicKey as SolanaPublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import type {
  TokenSigner,
  TokenSignerResult,
} from '../../../core/auth/auth.interface';
import type { PublicKey } from '../../../core/auth/auth.interface';

export abstract class SolanaTxTokenSigner implements TokenSigner {
  readonly alg = 'solana-tx';

  abstract subject: PublicKey;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterSolanaTxTokenSigner extends SolanaTxTokenSigner {
  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const tx = new Transaction();
    const subjectPublicKey = new SolanaPublicKey(
      this.subjectPublicKey.toString(),
    );
    tx.add(
      new TransactionInstruction({
        keys: [
          {
            pubkey: subjectPublicKey,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: subjectPublicKey,
        data: Buffer.from(payload),
      }),
    );
    tx.recentBlockhash = SolanaPublicKey.default.toString();
    tx.feePayer = subjectPublicKey;
    const signedTx = await this.dialectWalletAdapter.signTransaction(tx);
    return {
      payload: signedTx.serialize(),
      signature: signedTx.signature!,
    };
  }

  get subject(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }

  get subjectPublicKey(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }
}
