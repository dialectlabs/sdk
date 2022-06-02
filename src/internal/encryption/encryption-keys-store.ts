import type { DiffeHellmanKeys } from './encryption-keys-provider';

export abstract class EncryptionKeysStore {
  abstract get(): DiffeHellmanKeys | null;

  abstract save(token: DiffeHellmanKeys): DiffeHellmanKeys;

  static createInMemory(): EncryptionKeysStore {
    return new InmemoryEncryptionKeysStore();
  }

  static createSession(): EncryptionKeysStore {
    return new SessionStorageEncryptionKeysStore();
  }
}

export class InmemoryEncryptionKeysStore extends EncryptionKeysStore {
  private keys: DiffeHellmanKeys | null = null;

  get(): DiffeHellmanKeys | null {
    return this.keys;
  }

  save(keys: DiffeHellmanKeys): DiffeHellmanKeys {
    this.keys = keys;
    return this.keys;
  }
}

const sessionStorageEncryptionKeysKey = 'dialect-encryption-keys';

export class SessionStorageEncryptionKeysStore implements EncryptionKeysStore {
  get(): DiffeHellmanKeys | null {
    const keys = sessionStorage.getItem(sessionStorageEncryptionKeysKey);
    if (!keys) {
      return null;
    }
    return JSON.parse(keys) as DiffeHellmanKeys;
  }

  save(keys: DiffeHellmanKeys): DiffeHellmanKeys {
    sessionStorage.setItem(
      sessionStorageEncryptionKeysKey,
      JSON.stringify(keys),
    );
    return keys;
  }
}
