import type {
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '../auth.interface';

export abstract class Ed25519TokenSigner implements TokenSigner {
  readonly alg = 'ed25519';

  abstract subject: PublicKey;

  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}
