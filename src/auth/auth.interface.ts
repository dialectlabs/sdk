import { AuthTokensImpl } from '@auth/internal/token-utils';
import type { PublicKey } from '@solana/web3.js';
import type { Duration } from 'luxon';

export class Auth {
  static tokens = new AuthTokensImpl();
}

export abstract class AuthTokens {
  abstract generate(signer: TokenSigner, ttl: Duration): Promise<Token>;

  abstract parse(rawToken: string): Token;

  abstract isValid(token: Token): boolean;
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

export type TokenHeaderAlg = 'ed25519' | 'solana-tx' | string;

export interface TokenHeader {
  alg?: TokenHeaderAlg;
  typ?: string;
}

export interface TokenBody {
  sub: string;
  iat?: number;
  exp: number;
}

export interface TokenSignerResult {
  payload: Uint8Array;
  signature: Uint8Array;
}

export interface TokenSigner {
  alg: TokenHeaderAlg;
  subject: PublicKey;

  sign(payload: Uint8Array): Promise<TokenSignerResult>;
}
