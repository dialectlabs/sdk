import type { DiffeHellmanKeys } from '@encryption/encryption.interface';
import type { PublicKey } from '@solana/web3.js';

export abstract class EncryptionKeysStore {
  abstract get(subject: PublicKey): DiffeHellmanKeys | null;

  abstract save(subject: PublicKey, keys: DiffeHellmanKeys): DiffeHellmanKeys;

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

class InmemoryEncryptionKeysStore extends EncryptionKeysStore {
  private keys: Record<string, DiffeHellmanKeys> = {};

  get(subject: PublicKey): DiffeHellmanKeys | null {
    return this.keys[subject.toBase58()] ?? null;
  }

  save(subject: PublicKey, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    this.keys[subject.toBase58()] = keys;
    return keys;
  }
}

class SessionStorageEncryptionKeysStore extends EncryptionKeysStore {
  get(subject: PublicKey): DiffeHellmanKeys | null {
    const keys = sessionStorage.getItem(createStorageKey(subject.toBase58()));
    if (!keys) {
      return null;
    }
    return JSON.parse(keys) as DiffeHellmanKeys;
  }

  save(subject: PublicKey, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    sessionStorage.setItem(
      createStorageKey(subject.toBase58()),
      JSON.stringify(keys),
    );
    return keys;
  }
}

class LocalStorageEncryptionKeysStore extends EncryptionKeysStore {
  get(subject: PublicKey): DiffeHellmanKeys | null {
    const keys = localStorage.getItem(createStorageKey(subject.toBase58()));
    if (!keys) {
      return null;
    }
    return JSON.parse(keys) as DiffeHellmanKeys;
  }

  save(subject: PublicKey, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    localStorage.setItem(
      createStorageKey(subject.toBase58()),
      JSON.stringify(keys),
    );
    return keys;
  }
}

const storageEncryptionKeysPrefix = 'dialect-encryption-keys-';

function createStorageKey(subject: string) {
  return `${storageEncryptionKeysPrefix}-${subject}`;
}
