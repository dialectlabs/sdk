import nacl from 'tweetnacl';

export function generateEd25519Keypair() {
  return nacl.sign.keyPair.fromSeed(Uint8Array.from(nacl.randomBytes(32)));
}
