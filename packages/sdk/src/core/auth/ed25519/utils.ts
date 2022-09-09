import { randomBytes, sign } from 'tweetnacl';

export function generateEd25519Keypair() {
  return sign.keyPair.fromSeed(Uint8Array.from(randomBytes(32)));
}
