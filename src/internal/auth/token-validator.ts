import { PublicKey, Transaction } from '@solana/web3.js';
import { decodeURLSafe } from '@stablelib/base64';
import nacl from 'tweetnacl';
import type { Token } from '../../auth/auth.interface';
import { IllegalStateError } from '../../sdk/errors';

export abstract class TokenValidator {
  constructor(protected readonly token: Token) {}

  static newValidator(token: Token): TokenValidator {
    const { header } = token;
    if (header.alg === 'ed25519') {
      return new Ed25519TokenValidator(token);
    }

    if (header.alg === 'solana-tx') {
      return new SolanaTxTokenValidator(token);
    }

    throw new IllegalStateError('unsupported header alg');
  }

  isValid() {
    if (!this.isSignatureValid()) {
      return false;
    }
    return !this.isExpired(this.token);
  }

  abstract isSignatureValid(): boolean;

  private isExpired(token: Token) {
    const nowUtcSeconds = new Date().getTime() / 1000;
    const delta = 10;
    return nowUtcSeconds + delta > token.body.exp;
  }
}

class Ed25519TokenValidator extends TokenValidator {
  isSignatureValid(): boolean {
    const signedPayload = this.token.base64Header + '.' + this.token.base64Body;
    const signingPayload = new TextEncoder().encode(signedPayload);
    return nacl.sign.detached.verify(
      signingPayload,
      this.token.signature,
      new PublicKey(this.token.body.sub).toBytes(),
    );
  }
}

class SolanaTxTokenValidator extends TokenValidator {
  isSignatureValid(): boolean {
    const byteBody = decodeURLSafe(this.token.base64Body);
    const tx = Transaction.from(byteBody);
    tx.recentBlockhash = PublicKey.default.toString();
    return tx.verifySignatures();
  }
}
