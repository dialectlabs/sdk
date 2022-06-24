import type { Token } from '@auth/auth.interface';
import type { PublicKey } from '@solana/web3.js';
import {
  InMemoryTokenStore,
  LocalStorageTokenStore,
  SessionStorageTokenStore,
} from '@auth/internal/token-store';

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
