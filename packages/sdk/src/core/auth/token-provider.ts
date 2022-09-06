import type { Token } from './auth.interface';
import { IllegalArgumentError } from '../sdk/errors';
import { Duration } from 'luxon';
import { TokenStore } from './token-store';
import type { TokenParser } from './token-parser';
import type { TokenValidator } from './token-validator';
import type { AuthenticationFacade } from './authentication-facade';
import type { TokenGenerator } from './token-generator';
import type { PublicKey } from './auth.interface';

export const DEFAULT_TOKEN_LIFETIME = Duration.fromObject({ days: 1 });
export const MAX_TOKEN_LIFETIME = Duration.fromObject({ days: 1 });

export abstract class TokenProvider {
  abstract get(): Promise<Token>;

  static create(
    tokenAuthenticationStrategy: AuthenticationFacade,
    ttl: Duration = DEFAULT_TOKEN_LIFETIME,
    tokenStore: TokenStore = TokenStore.createInMemory(),
  ): TokenProvider {
    const defaultTokenProvider = new DefaultTokenProvider(
      ttl,
      tokenAuthenticationStrategy.tokenGenerator,
    );
    return new CachedTokenProvider(
      defaultTokenProvider,
      tokenStore,
      tokenAuthenticationStrategy.tokenParser,
      tokenAuthenticationStrategy.tokenValidator,
      tokenAuthenticationStrategy.signerSubject(),
    );
  }
}

class DefaultTokenProvider extends TokenProvider {
  constructor(
    private readonly ttl: Duration,
    private readonly tokenGenerator: TokenGenerator,
  ) {
    if (ttl.toMillis() > MAX_TOKEN_LIFETIME.toMillis()) {
      throw new IllegalArgumentError(
        `Token TTL ${ttl.toHuman()} must be <= ${MAX_TOKEN_LIFETIME.toHuman()}`,
      );
    }
    super();
  }

  get(): Promise<Token> {
    return this.tokenGenerator.generate(this.ttl);
  }
}

class CachedTokenProvider extends TokenProvider {
  constructor(
    private readonly delegate: TokenProvider,
    private readonly tokenStore: TokenStore,
    private readonly tokenParser: TokenParser,
    private readonly tokenValidator: TokenValidator,
    private readonly subject: PublicKey,
  ) {
    super();
  }

  private readonly delegateGetPromises: Record<string, Promise<Token>> = {};

  async get(): Promise<Token> {
    const existingToken = this.getToken();
    const subject = this.subject.toString();
    if (existingToken && this.tokenValidator.isValid(existingToken)) {
      delete this.delegateGetPromises[subject];
      return existingToken;
    }
    const existingDelegatePromise = this.delegateGetPromises[subject];
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }
    const delegatePromise = this.delegate.get().then((it) => {
      this.tokenStore.save(this.subject, it.rawValue);
      return it;
    });

    // delete promise to refetch the token in case of failure
    delegatePromise.catch(() => {
      delete this.delegateGetPromises[subject];
    });

    this.delegateGetPromises[subject] = delegatePromise;
    return delegatePromise;
  }

  private getToken(): Token | null {
    const rawToken = this.tokenStore.get(this.subject);
    if (!rawToken) {
      return null;
    }
    try {
      return this.tokenParser.parse(rawToken);
    } catch (e) {
      this.tokenStore.delete(this.subject);
      return null;
    }
  }
}
