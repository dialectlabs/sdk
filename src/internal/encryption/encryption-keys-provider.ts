import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import {
  EncryptionKeysStore,
  InmemoryEncryptionKeysStore,
} from './encryption-keys-store';

export interface DiffeHellmanKeys {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export abstract class EncryptionKeysProvider {
  abstract getFailSafe(): Promise<DiffeHellmanKeys | null>;

  abstract getFailFast(): Promise<DiffeHellmanKeys>;

  static create(
    dialectWalletAdapter: DialectWalletAdapterWrapper,
    encryptionKeysStore: EncryptionKeysStore = new InmemoryEncryptionKeysStore(),
  ): EncryptionKeysProvider {
    const provider = new DialectWalletAdapterEncryptionKeysProvider(
      dialectWalletAdapter,
    );
    return new CachedEncryptionKeysProvider(provider, encryptionKeysStore);
  }
}

export class DialectWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectWalletAdapterWrapper,
  ) {
    super();
  }

  getFailSafe(): Promise<DiffeHellmanKeys | null> {
    return this.dialectWalletAdapter.canEncrypt
      ? this.dialectWalletAdapter.diffieHellman()
      : Promise.resolve(null);
  }

  getFailFast(): Promise<DiffeHellmanKeys> {
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

  async getFailSafe(): Promise<DiffeHellmanKeys | null> {
    const existingKeys = this.encryptionKeysStore.get();
    if (!existingKeys) {
      const newKeys = await this.delegate.getFailSafe();
      if (newKeys) {
        return Promise.resolve(this.encryptionKeysStore.save(newKeys));
      }
    }
    return existingKeys;
  }

  async getFailFast(): Promise<DiffeHellmanKeys> {
    const existingKeys = this.encryptionKeysStore.get();
    if (!existingKeys) {
      const newKeys = await this.delegate.getFailFast();
      return Promise.resolve(this.encryptionKeysStore.save(newKeys));
    }
    return existingKeys;
  }
}
