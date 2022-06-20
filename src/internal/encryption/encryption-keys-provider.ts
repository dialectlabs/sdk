import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import {
  EncryptionKeysStore,
  InmemoryEncryptionKeysStore,
} from './encryption-keys-store';
import { UnsupportedOperationError } from '@sdk/errors';

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

  private delegateGetPromise: Promise<DiffeHellmanKeys | null> | null = null;

  async getFailSafe(): Promise<DiffeHellmanKeys | null> {
    const existingKeys = this.encryptionKeysStore.get();
    if (existingKeys) {
      this.delegateGetPromise = null;
      return existingKeys;
    }
    if (!this.delegateGetPromise) {
      this.delegateGetPromise = this.delegate
        .getFailSafe()
        .then((it) => it && this.encryptionKeysStore.save(it));
    }
    return this.delegateGetPromise;
  }

  async getFailFast(): Promise<DiffeHellmanKeys> {
    return this.getFailSafe().then((keys) => {
      if (!keys) {
        throw new UnsupportedOperationError(
          'Encryption not supported',
          'Wallet does not support encryption, please use wallet-adapter that supports diffieHellman() operation.',
        );
      }
      return keys;
    });
  }
}
