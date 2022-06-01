import { InMemoryTokenStore, TokenStore } from './token-store';
import { Duration } from 'luxon';
import type {
  Ed25519TokenSigner,
  Token,
  AuthTokens,
} from '@auth/auth.interface';
import { AuthTokensImpl } from '@auth/token-utils';

export abstract class TokenProvider {
  abstract get(): Promise<Token>;

  static create(
    signer: Ed25519TokenSigner,
    ttl: Duration = Duration.fromObject({ hours: 1 }),
    tokenStore: TokenStore = new InMemoryTokenStore(),
  ): TokenProvider {
    const tokenUtils = new AuthTokensImpl();
    const defaultTokenProvider = new DefaultTokenProvider(
      signer,
      ttl,
      tokenUtils,
    );
    return new CachedTokenProvider(
      defaultTokenProvider,
      tokenStore,
      tokenUtils,
    );
  }
}

class DefaultTokenProvider extends TokenProvider {
  constructor(
    private readonly signer: Ed25519TokenSigner,
    private readonly ttl: Duration,
    private readonly tokenUtils: AuthTokens,
  ) {
    super();
  }

  get(): Promise<Token> {
    return this.tokenUtils.generate(this.signer, this.ttl);
  }
}

class CachedTokenProvider extends TokenProvider {
  constructor(
    private readonly delegate: TokenProvider,
    private readonly tokenStore: TokenStore,
    private readonly tokenUtils: AuthTokens,
  ) {
    super();
  }

  async get(): Promise<Token> {
    const existingToken = this.tokenStore.get();
    if (
      !existingToken ||
      (existingToken && this.tokenUtils.isExpired(existingToken))
    ) {
      const newToken = await this.delegate.get();
      return Promise.resolve(this.tokenStore.save(newToken));
    }
    return existingToken;
  }
}
