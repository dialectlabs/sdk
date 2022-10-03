import type { AccountAddress } from './auth.interface';

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

  abstract get(subject: AccountAddress): string | null;

  abstract delete(subject: AccountAddress): void;

  abstract save(subject: AccountAddress, token: string): string;
}

class InMemoryTokenStore extends TokenStore {
  private tokens: Record<string, string> = {};

  get(subject: AccountAddress): string | null {
    return this.tokens[subject.toString()] ?? null;
  }

  save(subject: AccountAddress, token: string): string {
    this.tokens[subject.toString()] = token;
    return token;
  }

  delete(subject: AccountAddress): void {
    delete this.tokens[subject.toString()];
  }
}

class SessionStorageTokenStore extends TokenStore {
  get(subject: AccountAddress): string | null {
    const key = createStorageKey(subject.toString());
    return sessionStorage.getItem(key);
  }

  delete(subject: AccountAddress): void {
    const key = createStorageKey(subject.toString());
    sessionStorage.removeItem(key);
  }

  save(subject: AccountAddress, token: string): string {
    sessionStorage.setItem(createStorageKey(subject.toString()), token);
    return token;
  }
}

class LocalStorageTokenStore extends TokenStore {
  get(subject: AccountAddress): string | null {
    const key = createStorageKey(subject.toString());
    return localStorage.getItem(key);
  }

  save(subject: AccountAddress, token: string): string {
    localStorage.setItem(createStorageKey(subject.toString()), token);
    return token;
  }

  delete(subject: AccountAddress): void {
    localStorage.removeItem(createStorageKey(subject.toString()));
  }
}

const storageTokenKeyPrefix = 'dialect-auth-token';

function createStorageKey(subject: string) {
  return `${storageTokenKeyPrefix}-${subject}`;
}
