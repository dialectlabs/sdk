import type { PublicKey } from '@solana/web3.js';

export abstract class LitSignatureStore {
  abstract get(subject: PublicKey): string | null;

  abstract save(subject: PublicKey, signature: string): string;

  static createInMemory(): LitSignatureStore {
    return new InMemorySignatureStore();
  }

  static createSessionStorage(): LitSignatureStore {
    return new SessionStorageSignatureStore();
  }

  static createLocalStorage(): LitSignatureStore {
    return new LocalStorageSignatureStore();
  }
}

class InMemorySignatureStore extends LitSignatureStore {
  private signatures: Record<string, string> = {};

  get(subject: PublicKey): string | null {
    return this.signatures[subject.toBase58()] ?? null;
  }

  save(subject: PublicKey, signature: string): string {
    this.signatures[subject.toBase58()] = signature;
    return signature;
  }
}

class SessionStorageSignatureStore extends LitSignatureStore {
  get(subject: PublicKey): string | null {
    const key = createStorageKey(subject.toBase58());
    try {
      return sessionStorage.getItem(key);
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  save(subject: PublicKey, signature: string): string {
    sessionStorage.setItem(createStorageKey(subject.toBase58()), signature);
    return signature;
  }
}

class LocalStorageSignatureStore extends LitSignatureStore {
  get(subject: PublicKey): string | null {
    const key = createStorageKey(subject.toBase58());
    try {
      return localStorage.getItem(key);
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  save(subject: PublicKey, signature: string): string {
    localStorage.setItem(createStorageKey(subject.toBase58()), signature);
    return signature;
  }
}

const solAuthSigKeyPrefix = 'lit-auth-sol-signature';

function createStorageKey(subject: string) {
  return `${solAuthSigKeyPrefix}-${subject}`;
}
