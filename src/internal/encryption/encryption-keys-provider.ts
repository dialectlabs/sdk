import type { DialectWalletAdapterImpl } from '@wallet-adapter/internal/dialect-wallet-adapter-impl';
import {
  EncryptionKeysStore,
  InmemoryEncryptionKeysStore,
} from './encryption-keys-store';

export interface DiffeHellmanKeys {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptionKeysProvider {}

export abstract class EncryptionKeysProvider {
  abstract get(): Promise<DiffeHellmanKeys>;

  static create(
    dialectWalletAdapter: DialectWalletAdapterImpl,
    encryptionKeysStore: EncryptionKeysStore = new InmemoryEncryptionKeysStore(),
  ): EncryptionKeysProvider {
    const provider = new DialectWalletAdapterEncryptionKeysProvider(
      dialectWalletAdapter,
    );
    return new CachedEncryptionKeysProvider(provider, encryptionKeysStore);
  }
}

class DialectWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(private readonly dialectWalletAdapter: DialectWalletAdapterImpl) {
    super();
  }

  get(): Promise<DiffeHellmanKeys> {
    return this.dialectWalletAdapter.diffieHellman();
  }
}

class CachedEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly delegate: EncryptionKeysProvider,
    private readonly encryptionKeysStore: EncryptionKeysStore,
  ) {
    super();
  }

  async get(): Promise<DiffeHellmanKeys> {
    const existingKeys = this.encryptionKeysStore.get();
    if (!existingKeys) {
      const newKeys = await this.delegate.get();
      return Promise.resolve(this.encryptionKeysStore.save(newKeys));
    }
    return existingKeys;
  }
}
