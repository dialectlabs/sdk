import type { PublicKey, TokenSignerResult } from '../auth.interface';
import { Ed25519TokenSigner } from './ed25519-token-signer';
import { sign, SignKeyPair } from 'tweetnacl';
import { Ed25519PublicKey } from './ed25519-public-key';

export class NaclEd25519TokenSigner extends Ed25519TokenSigner {
  constructor(
    readonly keypair: SignKeyPair,
    readonly subjectPublicKey: PublicKey = new Ed25519PublicKey(
      keypair.publicKey,
    ),
    readonly subject: PublicKey = new Ed25519PublicKey(keypair.publicKey),
  ) {
    super();
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const signature = sign.detached(payload, this.keypair.secretKey);
    return {
      signature,
      payload,
    };
  }
}
