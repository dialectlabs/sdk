import nacl from 'tweetnacl';
import { TokenValidator } from '../token-validator';
import type { Token, TokenHeader } from '../auth.interface';
import { Ed25519PublicKey } from './ed25519-public-key';

export class TestEd25519TokenValidator extends TokenValidator {
  canValidate(tokenHeader: TokenHeader): boolean {
    return tokenHeader.alg === 'ed25519';
  }

  isSignatureValid(token: Token): boolean {
    const signedPayload = token.base64Header + '.' + token.base64Body;
    const signingPayload = new TextEncoder().encode(signedPayload);
    return nacl.sign.detached.verify(
      signingPayload,
      token.signature,
      new Ed25519PublicKey(token.body.sub_jwk ?? token.body.sub).toBytes(),
    );
  }
}
