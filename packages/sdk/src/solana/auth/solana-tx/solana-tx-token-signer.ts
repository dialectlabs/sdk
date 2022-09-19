import {
  PublicKey as SolanaPublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import type {
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '../../../core/auth/auth.interface';

export const SOLANA_TX_TOKEN_SIGNER_ALG = 'solana-tx';

export abstract class SolanaTxTokenSigner implements TokenSigner {
  readonly alg = SOLANA_TX_TOKEN_SIGNER_ALG;

  abstract subject: PublicKey;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterSolanaTxTokenSigner extends SolanaTxTokenSigner {
  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
  }

  get subject(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }

  get subjectPublicKey(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
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
}
