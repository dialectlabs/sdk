import type { DiffeHellmanKeys } from './encryption-keys-provider';

export abstract class EncryptionKeysStore {
  abstract get(): DiffeHellmanKeys | null;

  abstract save(keys: DiffeHellmanKeys): DiffeHellmanKeys;

  static createInMemory(): EncryptionKeysStore {
    return new InmemoryEncryptionKeysStore();
  }

  static createSessionStorage(): EncryptionKeysStore {
    return new SessionStorageEncryptionKeysStore();
  }

  static createLocalStorage(): EncryptionKeysStore {
    return new LocalStorageEncryptionKeysStore();
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

const storageEncryptionKeysKey = 'dialect-encryption-keys';

export class SessionStorageEncryptionKeysStore implements EncryptionKeysStore {
  get(): DiffeHellmanKeys | null {
    const keys = sessionStorage.getItem(storageEncryptionKeysKey);
    if (!keys) {
      return null;
    }
    return JSON.parse(keys) as DiffeHellmanKeys;
  }

  save(keys: DiffeHellmanKeys): DiffeHellmanKeys {
    sessionStorage.setItem(storageEncryptionKeysKey, JSON.stringify(keys));
    return keys;
  }
}

export class LocalStorageEncryptionKeysStore implements EncryptionKeysStore {
  get(): DiffeHellmanKeys | null {
    const keys = localStorage.getItem(storageEncryptionKeysKey);
    if (!keys) {
      return null;
    }
    return JSON.parse(keys) as DiffeHellmanKeys;
  }

  save(keys: DiffeHellmanKeys): DiffeHellmanKeys {
    localStorage.setItem(storageEncryptionKeysKey, JSON.stringify(keys));
    return keys;
  }
}
