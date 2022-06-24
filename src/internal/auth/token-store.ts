import { TokenStore } from '@auth/token-store';
import type { Token } from '@auth/auth.interface';
import type { PublicKey } from '@solana/web3.js';

export class InMemoryTokenStore extends TokenStore {
  private tokens: Map<string, Token> = new Map<string, Token>();

  get(subject: PublicKey): Token | null {
    return this.tokens.get(subject.toBase58()) ?? null;
  }

  save(token: Token): Token {
    this.tokens.set(token.body.sub, token);
    return token;
  }
}

export class SessionStorageTokenStore implements TokenStore {
  get(subject: PublicKey): Token | null {
    const token = sessionStorage.getItem(createStorageKey(subject.toBase58()));
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    sessionStorage.setItem(
      createStorageKey(token.body.sub),
      JSON.stringify(token),
    );
    return token;
  }
}

export class LocalStorageTokenStore implements TokenStore {
  get(subject: PublicKey): Token | null {
    const token = localStorage.getItem(createStorageKey(subject.toBase58()));
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    localStorage.setItem(
      createStorageKey(token.body.sub),
      JSON.stringify(token),
    );
    return token;
  }
}

const storageTokenKeyPrefix = 'dialect-auth-token-';

function createStorageKey(subject: string) {
  return `${storageTokenKeyPrefix}-${subject}`;
}
