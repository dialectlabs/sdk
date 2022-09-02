import { decodeURLSafe } from '@stablelib/base64';
import { PublicKey, Transaction } from '@solana/web3.js';
import { TokenValidator } from '../../../core/auth/token-validator';
import type { Token } from '../../../core/auth/auth.interface';

export class SolanaTxTokenValidator extends TokenValidator {
  isSignatureValid(token: Token): boolean {
    const byteBody = decodeURLSafe(token.base64Body);
    const tx = Transaction.from(byteBody);
    tx.recentBlockhash = PublicKey.default.toString();
    return tx.verifySignatures();
  }
}
