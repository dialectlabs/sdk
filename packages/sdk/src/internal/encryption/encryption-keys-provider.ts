import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';

import { UnsupportedOperationError } from '@sdk/errors';
import { EncryptionKeysStore } from '@encryption/encryption-keys-store';
import type { DiffeHellmanKeys } from '@encryption/encryption.interface';
import type { PublicKey } from '@solana/web3.js';

export abstract class EncryptionKeysProvider {
  abstract getFailSafe(): Promise<DiffeHellmanKeys | null>;

  abstract getFailFast(): Promise<DiffeHellmanKeys>;

  static create(
    dialectWalletAdapter: DialectWalletAdapterWrapper,
    encryptionKeysStore: EncryptionKeysStore = EncryptionKeysStore.createInMemory(),
  ): EncryptionKeysProvider {
    const provider = new DialectWalletAdapterEncryptionKeysProvider(
      dialectWalletAdapter,
    );
    return new CachedEncryptionKeysProvider(
      provider,
      encryptionKeysStore,
      dialectWalletAdapter.publicKey,
    );
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
    private readonly subject: PublicKey,
  ) {
    super();
  }

  private readonly delegateGetPromises: Record<
    string,
    Promise<DiffeHellmanKeys | null>
  > = {};

  async getFailSafe(): Promise<DiffeHellmanKeys | null> {
    const existingKeys = this.encryptionKeysStore.get(this.subject);
    const subject = this.subject.toBase58();
    if (existingKeys) {
      delete this.delegateGetPromises[subject];
      return existingKeys;
    }
    const existingDelegatePromise = this.delegateGetPromises[subject];
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }
    const delegatePromise = this.delegate
      .getFailSafe()
      .then((it) => it && this.encryptionKeysStore.save(this.subject, it));

    // delete promise to refetch the token in case of failure
    delegatePromise.catch(() => {
      delete this.delegateGetPromises[subject];
    });

    this.delegateGetPromises[subject] = delegatePromise;
    return delegatePromise;
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
