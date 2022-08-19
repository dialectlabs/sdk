import { AuthTokensImpl } from '@auth/internal/token-utils';
import type { WalletAddress } from '@wallet/internal/wallet-address';
import type { Duration } from 'luxon';
import { TokenStore } from '@auth/token-store';
import { DEFAULT_TOKEN_LIFETIME, TokenProvider } from '@auth/token-provider';

export abstract class Auth {
  static tokens: AuthTokens = new AuthTokensImpl();

  static createTokenProvider(
    signer: TokenSigner,
    ttl: Duration = DEFAULT_TOKEN_LIFETIME,
    tokenStore: TokenStore = TokenStore.createInMemory(),
  ): TokenProvider {
    return TokenProvider.create(signer, ttl, tokenStore);
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
  subject: WalletAddress;

  sign(payload: Uint8Array): Promise<TokenSignerResult>;
}
