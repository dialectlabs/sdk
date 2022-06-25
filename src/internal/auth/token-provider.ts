import { Duration } from 'luxon';
import type {
  AuthTokens,
  Ed25519TokenSigner,
  Token,
} from '@auth/auth.interface';
import { AuthTokensImpl } from '@auth/internal/token-utils';
import type { PublicKey } from '@solana/web3.js';
import { TokenStore } from '@auth/token-store';

export abstract class TokenProvider {
  abstract get(): Promise<Token>;

  static create(
    signer: Ed25519TokenSigner,
    ttl: Duration = Duration.fromObject({ hours: 1 }),
    tokenStore: TokenStore = TokenStore.createInMemory(),
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

  private readonly delegateGetPromises: Map<string, Promise<Token>> = new Map<
    string,
    Promise<Token>
  >();

  async get(): Promise<Token> {
    const existingToken = this.tokenStore.get(this.subject);
    const subject = this.subject.toBase58();
    if (existingToken && !this.tokenUtils.isExpired(existingToken)) {
      this.delegateGetPromises.delete(subject);
      return existingToken;
    }
    const existingDelegatePromise = this.delegateGetPromises.get(subject);
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }
    const delegatePromise = this.delegate
      .get()
      .then((it) => this.tokenStore.save(it));
    this.delegateGetPromises.set(subject, delegatePromise);
    return delegatePromise;
  }
}
