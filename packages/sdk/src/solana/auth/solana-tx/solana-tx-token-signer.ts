import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import type {
  TokenSigner,
  TokenSignerResult,
} from '../../../core/auth/auth.interface';

export abstract class SolanaTxTokenSigner implements TokenSigner {
  readonly alg = 'solana-tx';

  abstract subject: PublicKey;
  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterSolanaTxTokenSigner extends SolanaTxTokenSigner {
  readonly subject: PublicKey;

  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
    this.subject = dialectWalletAdapter.publicKey;
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const tx = new Transaction();
    tx.add(
      new TransactionInstruction({
        keys: [
          {
            pubkey: this.dialectWalletAdapter.publicKey,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: this.dialectWalletAdapter.publicKey,
        data: Buffer.from(payload),
      }),
    );
    tx.recentBlockhash = PublicKey.default.toString();
    tx.feePayer = this.dialectWalletAdapter.publicKey;
    const signedTx = await this.dialectWalletAdapter.signTransaction(tx);
    return {
      payload: signedTx.serialize(),
      signature: signedTx.signature!,
    };
  }
}
