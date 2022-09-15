import nacl from 'tweetnacl';
import { TokenValidator } from '../token-validator';
import type { Token } from '../auth.interface';
import { Ed25519PublicKey } from './ed25519-public-key';

export class Ed25519TokenValidator extends TokenValidator {
  isSignatureValid(token: Token): boolean {
    const signedPayload = token.base64Header + '.' + token.base64Body;
    const signingPayload = new TextEncoder().encode(signedPayload);
    const signerPublicKey = token.body.sub_jwk ?? token.body.sub;
    return nacl.sign.detached.verify(
      signingPayload,
      token.signature,
      new Ed25519PublicKey(signerPublicKey).toBytes(),
    );
  }
}
