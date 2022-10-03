import { UnsupportedOperationError } from '../sdk/errors';
import { EncryptionKeysStore } from './encryption-keys-store';
import type { DiffeHellmanKeys } from './encryption.interface';
import type { AccountAddress } from '../auth/auth.interface';

export abstract class EncryptionKeysProvider {
  static create(
    delegate: EncryptionKeysProvider,
    encryptionKeysStore: EncryptionKeysStore = EncryptionKeysStore.createInMemory(),
  ): EncryptionKeysProvider {
    return new CachedEncryptionKeysProvider(delegate, encryptionKeysStore);
  }

  abstract isAvailable(): boolean;

  abstract getFailSafe(
    subject: AccountAddress,
  ): Promise<DiffeHellmanKeys | null>;

  abstract getFailFast(subject: AccountAddress): Promise<DiffeHellmanKeys>;
}

class CachedEncryptionKeysProvider extends EncryptionKeysProvider {
  private readonly delegateGetPromises: Record<
    AccountAddress,
    Promise<DiffeHellmanKeys | null>
  > = {};

  constructor(
    private readonly delegate: EncryptionKeysProvider,
    private readonly encryptionKeysStore: EncryptionKeysStore,
  ) {
    super();
  }

  isAvailable(): boolean {
    return this.delegate.isAvailable();
  }

  async getFailSafe(subject: AccountAddress): Promise<DiffeHellmanKeys | null> {
    const existingKeys = this.encryptionKeysStore.get(subject);
    if (existingKeys) {
      delete this.delegateGetPromises[subject.toString()];
      return existingKeys;
    }
    const existingDelegatePromise =
      this.delegateGetPromises[subject.toString()];
    if (existingDelegatePromise) {
      return existingDelegatePromise;
    }
    const delegatePromise = this.delegate
      .getFailSafe(subject)
      .then((it) => it && this.encryptionKeysStore.save(subject, it));

    // delete promise to refetch the token in case of failure
    delegatePromise.catch(() => {
      delete this.delegateGetPromises[subject.toString()];
    });

    this.delegateGetPromises[subject.toString()] = delegatePromise;
    return delegatePromise;
  }

  async getFailFast(subject: AccountAddress): Promise<DiffeHellmanKeys> {
    return this.getFailSafe(subject).then((keys) => {
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
