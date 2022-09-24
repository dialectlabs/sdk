import { decodeURLSafe } from '@stablelib/base64';
import { PublicKey, Transaction } from '@solana/web3.js';
import type { Token, TokenHeader } from '@dialectlabs/sdk';
import { TokenValidator } from '@dialectlabs/sdk';
import { SOLANA_TX_TOKEN_SIGNER_ALG } from './solana-tx-token-signer';

export class SolanaTxTokenValidator extends TokenValidator {
  canValidate(tokenHeader: TokenHeader): boolean {
    return tokenHeader.alg === SOLANA_TX_TOKEN_SIGNER_ALG;
  }

  isSignatureValid(token: Token): boolean {
    const byteBody = decodeURLSafe(token.base64Body);
    const tx = Transaction.from(byteBody);
    tx.recentBlockhash = PublicKey.default.toString();
    return tx.verifySignatures();
  }

  override performExtraValidation(token: Token): boolean {
    return token.body.sub === token.body.sub_jwk;
  }
}
