import { Duration } from 'luxon';
import type {
  AuthTokens,
  Ed25519TokenSigner,
  Token,
} from '@auth/auth.interface';
import { AuthTokensImpl } from '@auth/internal/token-utils';
import type { PublicKey } from '@solana/web3.js';
import { InMemoryTokenStore } from '@auth/internal/token-store';
import type { TokenStore } from '@auth/token-store';

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
      signer.subject,
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
    private readonly subject: PublicKey,
  ) {
    super();
  }

  private delegateGetPromise: Promise<Token> | null = null;

  async get(): Promise<Token> {
    const existingToken = this.tokenStore.get(this.subject);
    if (existingToken && !this.tokenUtils.isExpired(existingToken)) {
      this.delegateGetPromise = null;
      return existingToken;
    }
    if (!this.delegateGetPromise) {
      this.delegateGetPromise = this.delegate
        .get()
        .then((it) => this.tokenStore.save(it));
    }
    return this.delegateGetPromise;
  }
}
