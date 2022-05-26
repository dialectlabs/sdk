import { Token, TokenSigner } from './token';
import { InMemoryTokenStore, TokenStore } from './token-store';
import { Duration } from 'luxon';

export abstract class TokenProvider {
  abstract get(): Promise<Token>;

  create(
    signer: TokenSigner,
    ttl: Duration = Duration.fromObject({ hours: 1 }),
    tokenStore: TokenStore = new InMemoryTokenStore(),
  ): TokenProvider {
    const defaultTokenProvider = new DefaultTokenProvider(signer, ttl);
    return new CachedTokenProvider(defaultTokenProvider, tokenStore);
  }
}

class DefaultTokenProvider extends TokenProvider {
  constructor(
    private readonly signer: TokenSigner,
    private readonly ttl: Duration,
  ) {
    super();
  }

  get(): Promise<Token> {
    return Token.generate(this.signer, this.ttl);
  }
}

class CachedTokenProvider extends TokenProvider {
  constructor(
    private readonly delegate: TokenProvider,
    private readonly tokenStore: TokenStore,
  ) {
    super();
  }

  async get(): Promise<Token> {
    const existingToken = this.tokenStore.get();
    if (!existingToken || (existingToken && Token.isExpired(existingToken))) {
      const newToken = await this.delegate.get();
      return Promise.resolve(this.tokenStore.save(newToken));
    }
    return existingToken;
  }
}
