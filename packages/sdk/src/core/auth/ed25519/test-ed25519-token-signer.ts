import type {
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '../auth.interface';
import { sign, SignKeyPair } from 'tweetnacl';
import { Ed25519PublicKey } from './ed25519-public-key';
import { generateEd25519Keypair } from './utils';

export class TestEd25519TokenSigner implements TokenSigner {
  readonly alg = 'ed25519';

  constructor(
    readonly keypair: SignKeyPair = generateEd25519Keypair(),
    readonly subjectPublicKey: PublicKey = new Ed25519PublicKey(
      keypair.publicKey,
    ),
    readonly subject: PublicKey = new Ed25519PublicKey(keypair.publicKey),
  ) {}

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const signature = sign.detached(payload, this.keypair.secretKey);
    return {
      signature,
      payload,
    };
  }
}
