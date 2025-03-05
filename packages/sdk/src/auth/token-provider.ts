import type { AccountAddress, Token } from './auth.interface';
import { TokenStore } from './token-store';
import type { TokenParser } from './token-parser';
import type { TokenValidator } from './token-validator';
import type { AuthenticationFacade } from './authentication-facade';
import type { TokenGenerator } from './token-generator';
import type { DataServiceWalletsApiClientV1 } from '../dialect-cloud-api/data-service-wallets-api.v1';
import type { WalletCreation } from '../sdk/sdk.interface';

export const DEFAULT_TOKEN_LIFETIME_SECONDS = 24 * 60 * 60; // 24 hours

export abstract class TokenProvider {
  static create(
    authenticationFacade: AuthenticationFacade,
    dataServiceWalletsApiClientV1: DataServiceWalletsApiClientV1,
    ttlSeconds = DEFAULT_TOKEN_LIFETIME_SECONDS,
    tokenStore: TokenStore = TokenStore.createInMemory(),
    walletCreation: WalletCreation = 'implicit',
  ): TokenProvider {
    const defaultTokenProvider = new DefaultTokenProvider(
      ttlSeconds,
      authenticationFacade.tokenGenerator,
    );
    return new CachedTokenProvider(
      defaultTokenProvider,
      tokenStore,
      walletCreation,
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
    private readonly ttlSeconds: number,
    private readonly tokenGenerator: TokenGenerator,
  ) {
    super();
  }

  get(): Promise<Token> {
    return this.tokenGenerator.generate(this.ttlSeconds);
  }
}

export class CachedTokenProvider extends TokenProvider {
  private readonly delegateGetPromises: Record<string, Promise<Token>> = {};

  constructor(
    private readonly delegate: TokenProvider,
    private readonly tokenStore: TokenStore,
    private readonly walletCreation: WalletCreation,
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
      return existingToken;
    }
    const existingDelegatePromise = this.delegateGetPromises[subject];
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }

    const delegatePromise = this.delegate.get().then(async (it) => {
      this.tokenStore.save(this.subject, it.rawValue);
      delete this.delegateGetPromises[subject];
      const wallet: { publicKey: string } = {
        publicKey: this.subject,
      };
      if (this.walletCreation === 'implicit') {
        await this.dataServiceWalletsApiClientV1.upsertWallet(wallet, it);
      }
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
