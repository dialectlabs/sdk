import type { DiffeHellmanKeys } from '@encryption/encryption.interface';
import type { WalletAddress } from '../internal/wallet/wallet-address';


export abstract class EncryptionKeysStore {
  abstract get(subject: WalletAddress): DiffeHellmanKeys | null;

  abstract save(subject: WalletAddress, keys: DiffeHellmanKeys): DiffeHellmanKeys;

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

  get(subject: WalletAddress): DiffeHellmanKeys | null {
    return this.keys[subject.toBase58()] ?? null;
  }

  save(subject: WalletAddress, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    this.keys[subject.toBase58()] = keys;
    return keys;
  }
}

class SessionStorageEncryptionKeysStore extends EncryptionKeysStore {
  get(subject: WalletAddress): DiffeHellmanKeys | null {
    const key = createStorageKey(subject.toBase58());
    try {
      const keys = sessionStorage.getItem(key);
      if (!keys) {
        return null;
      }
      return deserializeDiffeHellmanKeys(keys);
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  save(subject: WalletAddress, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    sessionStorage.setItem(
      createStorageKey(subject.toBase58()),
      serializeDiffeHellmanKeys(keys),
    );
    return keys;
  }
}

class LocalStorageEncryptionKeysStore extends EncryptionKeysStore {
  get(subject: WalletAddress): DiffeHellmanKeys | null {
    const key = createStorageKey(subject.toBase58());
    try {
      const keys = localStorage.getItem(key);
      if (!keys) {
        return null;
      }
      return deserializeDiffeHellmanKeys(keys) as DiffeHellmanKeys;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  save(subject: WalletAddress, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    localStorage.setItem(
      createStorageKey(subject.toBase58()),
      serializeDiffeHellmanKeys(keys),
    );
    return keys;
  }
}

// #region json storage

const storageEncryptionKeysPrefix = 'dialect-encryption-keys';

function createStorageKey(subject: string) {
  return `${storageEncryptionKeysPrefix}-${subject}`;
}

interface DiffeHellmanKeysSerializable {
  version: 1;
  keys: {
    publicKey: number[];
    secretKey: number[];
  };
}

export function serializeDiffeHellmanKeys(keys: DiffeHellmanKeys): string {
  const toSerialize: DiffeHellmanKeysSerializable = {
    version: 1,
    keys: {
      publicKey: Array.from(keys.publicKey),
      secretKey: Array.from(keys.secretKey),
    },
  };

  return JSON.stringify(toSerialize);
}

export function deserializeDiffeHellmanKeys(data: string): DiffeHellmanKeys {
  const deserialized = JSON.parse(data) as DiffeHellmanKeysSerializable;
  return {
    publicKey: Uint8Array.from(deserialized.keys.publicKey),
    secretKey: Uint8Array.from(deserialized.keys.secretKey),
  };
}

// #endregion
