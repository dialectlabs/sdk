import ed2curve from 'ed2curve';
import { Err, Ok, Result } from 'ts-results';
import nacl from 'tweetnacl';

export const ENCRYPTION_OVERHEAD_BYTES = 16;

export class IncorrectPublicKeyFormatError extends Error {
  constructor() {
    super('IncorrectPublicKeyFormatError');
  }
}

export class AuthenticationFailedError extends Error {
  constructor() {
    super('Authentication failed during decryption attempt');
  }
}

export type Curve25519Key = Uint8Array;

export type Curve25519KeyPair = {
  publicKey: Curve25519Key;
  secretKey: Curve25519Key;
};

export type Ed25519Key = Uint8Array;

export type Ed25519KeyPair = {
  publicKey: Curve25519Key;
  secretKey: Curve25519Key;
};

export function ed25519KeyPairToCurve25519({
  publicKey,
  secretKey,
}: Ed25519KeyPair): Result<Curve25519KeyPair, IncorrectPublicKeyFormatError> {
  const curve25519KeyPair = ed2curve.convertKeyPair({
    publicKey,
    secretKey,
  });
  if (!curve25519KeyPair) {
    return Err(new IncorrectPublicKeyFormatError());
  }
  return Ok(curve25519KeyPair);
}

export function ed25519PublicKeyToCurve25519(key: Ed25519Key): Result<Curve25519Key, IncorrectPublicKeyFormatError> {
  const curve25519PublicKey = ed2curve.convertPublicKey(key);
  if (!curve25519PublicKey) {
    return Err(new IncorrectPublicKeyFormatError());
  }
  return Ok(curve25519PublicKey);
}

export function ecdhEncrypt(
  payload: Uint8Array,
  { secretKey, publicKey }: Curve25519KeyPair,
  otherPartyPublicKey: Ed25519Key,
  nonce: Uint8Array,
): Result<Uint8Array, IncorrectPublicKeyFormatError> {
  const key = ed25519PublicKeyToCurve25519(otherPartyPublicKey);
  if (key.ok) {
    return Ok(nacl.box(payload, nonce, key.val, secretKey));
  } else {
    return Err(key.val);
  }
}

export function ecdhDecrypt(
  payload: Uint8Array,
  { secretKey, publicKey }: Curve25519KeyPair,
  otherPartyPublicKey: Ed25519Key,
  nonce: Uint8Array,
): Result<Uint8Array, AuthenticationFailedError | IncorrectPublicKeyFormatError> {
  const key = ed25519PublicKeyToCurve25519(otherPartyPublicKey);
  if (key.ok) {
    const decrypted = nacl.box.open(payload, nonce, key.val, secretKey);
    if (decrypted) {
      return Ok(decrypted);
    } else {
      return Err(new AuthenticationFailedError());
    }
  } else {
    return Err(key.val);
  }
}
