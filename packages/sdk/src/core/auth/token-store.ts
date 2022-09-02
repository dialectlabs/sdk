import type { PublicKey } from '@solana/web3.js';

export abstract class TokenStore {
  abstract get(subject: PublicKey): string | null;

  abstract delete(subject: PublicKey): void;

  abstract save(subject: PublicKey, token: string): string;

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
  private tokens: Record<string, string> = {};

  get(subject: PublicKey): string | null {
    return this.tokens[subject.toBase58()] ?? null;
  }

  save(subject: PublicKey, token: string): string {
    this.tokens[subject.toBase58()] = token;
    return token;
  }

  delete(subject: PublicKey): void {
    delete this.tokens[subject.toBase58()];
  }
}

class SessionStorageTokenStore extends TokenStore {
  get(subject: PublicKey): string | null {
    const key = createStorageKey(subject.toBase58());
    return sessionStorage.getItem(key);
  }

  delete(subject: PublicKey): void {
    const key = createStorageKey(subject.toBase58());
    sessionStorage.removeItem(key);
  }

  save(subject: PublicKey, token: string): string {
    sessionStorage.setItem(createStorageKey(subject.toBase58()), token);
    return token;
  }
}

class LocalStorageTokenStore extends TokenStore {
  get(subject: PublicKey): string | null {
    const key = createStorageKey(subject.toBase58());
    return localStorage.getItem(key);
  }

  save(subject: PublicKey, token: string): string {
    localStorage.setItem(createStorageKey(subject.toBase58()), token);
    return token;
  }

  delete(subject: PublicKey): void {
    localStorage.removeItem(createStorageKey(subject.toBase58()));
  }
}

const storageTokenKeyPrefix = 'dialect-auth-token';

function createStorageKey(subject: string) {
  return `${storageTokenKeyPrefix}-${subject}`;
}
