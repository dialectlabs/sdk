import type { AccountAddress, Token } from './auth.interface';
import { IllegalArgumentError } from '../sdk/errors';
import { Duration } from 'luxon';
import { TokenStore } from './token-store';
import type { TokenParser } from './token-parser';
import type { TokenValidator } from './token-validator';
import type { AuthenticationFacade } from './authentication-facade';
import type { TokenGenerator } from './token-generator';
import type { WalletDto } from '../dialect-cloud-api/data-service-dapps-api';
import type { DataServiceWalletsApiClientV1 } from '../dialect-cloud-api/data-service-wallets-api.v1';

export const DEFAULT_TOKEN_LIFETIME = Duration.fromObject({ days: 1 });
export const MAX_TOKEN_LIFETIME = Duration.fromObject({ days: 1 });

export abstract class TokenProvider {
  static create(
    authenticationFacade: AuthenticationFacade,
    dataServiceWalletsApiClientV1: DataServiceWalletsApiClientV1,
    ttl: Duration = DEFAULT_TOKEN_LIFETIME,
    tokenStore: TokenStore = TokenStore.createInMemory(),
  ): TokenProvider {
    const defaultTokenProvider = new DefaultTokenProvider(
      ttl,
      authenticationFacade.tokenGenerator,
    );
    return new CachedTokenProvider(
      defaultTokenProvider,
      tokenStore,
      authenticationFacade.authenticator.parser,
      authenticationFacade.authenticator.validator,
      authenticationFacade.subject(),
      dataServiceWalletsApiClientV1,
    );
  }

  abstract get(): Promise<Token>;
}

export class DefaultTokenProvider extends TokenProvider {
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

export class CachedTokenProvider extends TokenProvider {
  private readonly delegateGetPromises: Record<string, Promise<Token>> = {};

  constructor(
    private readonly delegate: TokenProvider,
    private readonly tokenStore: TokenStore,
    private readonly tokenParser: TokenParser,
    private readonly tokenValidator: TokenValidator,
    private readonly subject: AccountAddress,
    private readonly dataServiceWalletsApiClientV1: DataServiceWalletsApiClientV1,
  ) {
    super();
  }

  async get(): Promise<Token> {
    const existingToken = this.getCachedToken();
    const subject = this.subject.toString();
    if (existingToken && this.tokenValidator.isValid(existingToken)) {
      delete this.delegateGetPromises[subject];
      return existingToken;
    }
    const existingDelegatePromise = this.delegateGetPromises[subject];
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }

    const delegatePromise = this.delegate.get().then(async (it) => {
      this.tokenStore.save(this.subject, it.rawValue);
      const wallet: { publicKey: string } = {
        publicKey: this.subject,
      };
      await this.dataServiceWalletsApiClientV1.upsertWallet(wallet, it);
      return it;
    });

    // delete promise to refetch the token in case of failure
    delegatePromise.catch((it) => {
      delete this.delegateGetPromises[subject];
    });

    this.delegateGetPromises[subject] = delegatePromise;
    return delegatePromise;
  }

  hasValidCachedToken() {
    const cachedToken = this.getCachedToken();
    if (!cachedToken) {
      return false;
    }
    return this.tokenValidator.isValid(cachedToken);
  }

  private getCachedToken(): Token | null {
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
