import type { Token } from '@auth/auth.interface';
import type { PublicKey } from '@solana/web3.js';
import { TokenParser } from '../internal/auth/token-parser';

export abstract class TokenStore {
  abstract get(subject: PublicKey): Token | null;

  abstract save(token: Token): Token;

  static createInMemory(): TokenStore {
    return new InMemoryTokenStore();
  }

  static createSessionStorage(): TokenStore {
    return new SessionStorageTokenStore();
  }

  static createLocalStorage(): TokenStore {
    return new LocalStorageTokenStore();
  }
}

class InMemoryTokenStore extends TokenStore {
  private tokens: Record<string, Token> = {};

  get(subject: PublicKey): Token | null {
    return this.tokens[subject.toBase58()] ?? null;
  }

  save(token: Token): Token {
    this.tokens[token.body.sub] = token;
    return token;
  }
}

class SessionStorageTokenStore extends TokenStore {
  get(subject: PublicKey): Token | null {
    const key = createStorageKey(subject.toBase58());
    try {
      const token = sessionStorage.getItem(key);
      if (!token) {
        return null;
      }
      return TokenParser.parse(token) as Token;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  save(token: Token): Token {
    sessionStorage.setItem(createStorageKey(token.body.sub), token.rawValue);
    return token;
  }
}

class LocalStorageTokenStore extends TokenStore {
  get(subject: PublicKey): Token | null {
    const key = createStorageKey(subject.toBase58());
    try {
      const token = localStorage.getItem(key);
      if (!token) {
        return null;
      }
      return TokenParser.parse(token) as Token;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  save(token: Token): Token {
    localStorage.setItem(createStorageKey(token.body.sub), token.rawValue);
    return token;
  }
}

const storageTokenKeyPrefix = 'dialect-auth-token';

function createStorageKey(subject: string) {
  return `${storageTokenKeyPrefix}-${subject}`;
}
