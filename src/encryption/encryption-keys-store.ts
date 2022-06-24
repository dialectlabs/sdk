import type { DiffeHellmanKeys } from '@encryption/encryption.interface';
import {
  InmemoryEncryptionKeysStore,
  LocalStorageEncryptionKeysStore,
  SessionStorageEncryptionKeysStore,
} from '@encryption/internal/encryption-keys-store';
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
