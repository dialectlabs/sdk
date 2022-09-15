import { Ed25519TokenValidator } from '../../../core/auth/ed25519/ed25519-token-validator';
import type { Token } from '../../../core/auth/auth.interface';

export class SolanaEd25519TokenValidator extends Ed25519TokenValidator {
  override isValid(token: Token): boolean {
    const isTokenValid = super.isValid(token);
    return isTokenValid && token.body.sub === token.body.sub_jwk;
  }
}
