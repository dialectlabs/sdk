import type { PublicKey } from '@solana/web3.js';
import type { Duration } from 'luxon';

export interface AuthTokenUtils {
  generate(signer: Ed25519TokenSigner, ttl: Duration): Promise<Token>;

  parse(rawToken: string): Token;

  isValid(token: Token): boolean;

  isSignatureValid(token: Token): boolean;

  isExpired(token: Token): boolean;
}

export interface Token {
  rawValue: string;
  header: TokenHeader;
  body: TokenBody;
  signature: Uint8Array;
  base64Header: string;
  base64Body: string;
  base64Signature: string;
}

export interface TokenHeader {
  alg?: string;
  typ?: string;
}

export interface TokenBody {
  sub: string;
  iat?: number;
  exp: number;
}

export interface Ed25519TokenSigner {
  subject: PublicKey;

  sign(payload: Uint8Array): Promise<Uint8Array>;
}
