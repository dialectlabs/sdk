import {
  PublicKey as SolanaPublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import type { DialectSolanaWalletAdapterWrapper } from '../../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type {
  AccountAddress,
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '@dialectlabs/sdk';

export const SOLANA_TX_TOKEN_SIGNER_ALG = 'solana-tx';

export abstract class SolanaTxTokenSigner implements TokenSigner {
  readonly alg = SOLANA_TX_TOKEN_SIGNER_ALG;

  abstract subject: AccountAddress;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterSolanaTxTokenSigner extends SolanaTxTokenSigner {
  constructor(
    readonly dialectWalletAdapter: DialectSolanaWalletAdapterWrapper,
  ) {
    super();
  }

  get subject(): AccountAddress {
    return this.dialectWalletAdapter.publicKey.toBase58();
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
