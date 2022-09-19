import type { PublicKey } from './auth.interface';

export abstract class TokenStore {
  static createInMemory(): TokenStore {
    return new InMemoryTokenStore();
  }

  static createSessionStorage(): TokenStore {
    return new SessionStorageTokenStore();
  }

  static createLocalStorage(): TokenStore {
    return new LocalStorageTokenStore();
  }

  abstract get(subject: PublicKey): string | null;

  abstract delete(subject: PublicKey): void;

  abstract save(subject: PublicKey, token: string): string;
}

class InMemoryTokenStore extends TokenStore {
  private tokens: Record<string, string> = {};

  get(subject: PublicKey): string | null {
    return this.tokens[subject.toString()] ?? null;
  }

  save(subject: PublicKey, token: string): string {
    this.tokens[subject.toString()] = token;
    return token;
  }

  delete(subject: PublicKey): void {
    delete this.tokens[subject.toString()];
  }
}

class SessionStorageTokenStore extends TokenStore {
  get(subject: PublicKey): string | null {
    const key = createStorageKey(subject.toString());
    return sessionStorage.getItem(key);
  }

  delete(subject: PublicKey): void {
    const key = createStorageKey(subject.toString());
    sessionStorage.removeItem(key);
  }

  save(subject: PublicKey, token: string): string {
    sessionStorage.setItem(createStorageKey(subject.toString()), token);
    return token;
  }
}

class LocalStorageTokenStore extends TokenStore {
  get(subject: PublicKey): string | null {
    const key = createStorageKey(subject.toString());
    return localStorage.getItem(key);
  }

  save(subject: PublicKey, token: string): string {
    localStorage.setItem(createStorageKey(subject.toString()), token);
    return token;
  }

  delete(subject: PublicKey): void {
    localStorage.removeItem(createStorageKey(subject.toString()));
  }
}

const storageTokenKeyPrefix = 'dialect-auth-token';

function createStorageKey(subject: string) {
  return `${storageTokenKeyPrefix}-${subject}`;
}
