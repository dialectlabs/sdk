import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { TokenValidator } from '../token-validator';
import type { Token } from '../auth.interface';

export class Ed25519TokenValidator extends TokenValidator {
  isSignatureValid(token: Token): boolean {
    const signedPayload = token.base64Header + '.' + token.base64Body;
    const signingPayload = new TextEncoder().encode(signedPayload);
    return nacl.sign.detached.verify(
      signingPayload,
      token.signature,
      new PublicKey(token.body.sub).toBytes(),
    );
  }
}
