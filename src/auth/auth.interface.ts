import { AuthTokensImpl } from '@auth/internal/token-utils';
import type { PublicKey } from '@solana/web3.js';
import { Duration } from 'luxon';
import { TokenStore } from '@auth/token-store';
import {
  CachedTokenProvider,
  DefaultTokenProvider,
} from '@auth/internal/token-provider';

export abstract class Auth {
  static tokens = new AuthTokensImpl();

  static createTokenProvider(
    signer: TokenSigner,
    ttl: Duration = Duration.fromObject({ hours: 1 }),
    tokenStore: TokenStore = TokenStore.createInMemory(),
  ): TokenProvider {
    const authTokens = Auth.tokens;
    const defaultTokenProvider = new DefaultTokenProvider(
      signer,
      ttl,
      authTokens,
    );
    return new CachedTokenProvider(
      defaultTokenProvider,
      tokenStore,
      authTokens,
      signer.subject,
    );
  }
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

export abstract class TokenProvider {
  abstract get(): Promise<Token>;
}
