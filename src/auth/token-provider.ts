import type { AuthTokens, Token, TokenSigner } from '@auth/auth.interface';
import { TokenStore } from '@auth/token-store';
import type { PublicKey } from '@solana/web3.js';
import { Duration } from 'luxon';
import { AuthTokensImpl } from '@auth/internal/token-utils';

export abstract class TokenProvider {
  abstract get(): Promise<Token>;

  static create(
    signer: TokenSigner,
    ttl: Duration = Duration.fromObject({ hours: 1 }),
    tokenStore: TokenStore = TokenStore.createInMemory(),
  ): TokenProvider {
    const authTokens = new AuthTokensImpl();
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

class DefaultTokenProvider extends TokenProvider {
  constructor(
    private readonly signer: TokenSigner,
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

  private readonly delegateGetPromises: Record<string, Promise<Token>> = {};

  async get(): Promise<Token> {
    const existingToken = this.tokenStore.get(this.subject);
    const subject = this.subject.toBase58();
    if (existingToken && this.tokenUtils.isValid(existingToken)) {
      delete this.delegateGetPromises[subject];
      return existingToken;
    }
    const existingDelegatePromise = this.delegateGetPromises[subject];
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }
    const delegatePromise = this.delegate
      .get()
      .then((it) => this.tokenStore.save(it));
    this.delegateGetPromises[subject] = delegatePromise;
    return delegatePromise;
  }
}
