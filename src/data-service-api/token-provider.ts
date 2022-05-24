export interface TokenProvider {
  get(): Token;
}

export class CachedTokenProvider implements TokenProvider {
  constructor(private readonly tokenStore: TokenStore) {}

  get(): Token {
    // TODO: implement
    return {
      raw: 'fsdfs',
      expiresAt: new Date(),
    };
  }
}

export interface TokenStore {
  get(): Token;

  save(token: Token): void;
}

export class InMemoryTokenStore implements TokenStore {
  get(): Token {
    return {
      raw: 'fsdfs',
      expiresAt: new Date(),
    };
  }

  save(token: Token): void {
    console.log(token);
    return;
  }
}

export class SessionStorageTokenStore implements TokenStore {
  get(): Token {
    return {
      raw: 'fsdfs',
      expiresAt: new Date(),
    };
  }

  save(token: Token): void {
    console.log(token);
    return;
  }
}
