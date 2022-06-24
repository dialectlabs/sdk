import type { DiffeHellmanKeys } from '@encryption/encryption.interface';
import { EncryptionKeysStore } from '@encryption/encryption-keys-store';
import type { PublicKey } from '@solana/web3.js';

export class InmemoryEncryptionKeysStore extends EncryptionKeysStore {
  private keys: Map<string, DiffeHellmanKeys> = new Map<
    string,
    DiffeHellmanKeys
  >();

  get(subject: PublicKey): DiffeHellmanKeys | null {
    return this.keys.get(subject.toBase58()) ?? null;
  }

  save(subject: PublicKey, keys: DiffeHellmanKeys): DiffeHellmanKeys {
    this.keys.set(subject.toBase58(), keys);
    return keys;
  }
}

export class SessionStorageEncryptionKeysStore implements EncryptionKeysStore {
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

export class LocalStorageEncryptionKeysStore implements EncryptionKeysStore {
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
