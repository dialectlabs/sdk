import type { Token, TokenHeader } from '../../../core/auth/auth.interface';
import { TokenValidator } from '../../../core/auth/token-validator';
import nacl from 'tweetnacl';
import { Ed25519PublicKey } from '../../../core/auth/ed25519/ed25519-public-key';
import {
  SOLANA_ED25519_TOKEN_SIGNER_ALG,
  SOLANA_ED25519_TOKEN_SIGNER_ALG_BACKWARD_COMPATIBLE,
} from './solana-ed25519-token-signer';

export class SolanaEd25519TokenValidator extends TokenValidator {
  canValidate(tokenHeader: TokenHeader): boolean {
    return (
      tokenHeader.alg === SOLANA_ED25519_TOKEN_SIGNER_ALG ||
      tokenHeader.alg === SOLANA_ED25519_TOKEN_SIGNER_ALG_BACKWARD_COMPATIBLE
    );
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

  protected override validateCustom(token: Token): boolean {
    if (!token.body.sub_jwk) {
      return true;
    }
    return token.body.sub === token.body.sub_jwk;
  }
}
