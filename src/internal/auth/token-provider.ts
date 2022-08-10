import type { AuthTokens, Token, TokenSigner } from '@auth/auth.interface';
import { TokenProvider } from '@auth/auth.interface';
import type { TokenStore } from '@auth/token-store';
import type { PublicKey } from '@solana/web3.js';
import type { Duration } from 'luxon';

export class DefaultTokenProvider extends TokenProvider {
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

export class CachedTokenProvider extends TokenProvider {
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
