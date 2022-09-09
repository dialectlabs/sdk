import { UnsupportedOperationError } from '../../sdk/errors';
import { EncryptionKeysStore } from '../../encryption/encryption-keys-store';
import type { DiffeHellmanKeys } from '../../encryption/encryption.interface';
import type { PublicKey } from '../../auth/auth.interface';

export abstract class EncryptionKeysProvider {
  abstract getFailSafe(subject: PublicKey): Promise<DiffeHellmanKeys | null>;

  abstract getFailFast(subject: PublicKey): Promise<DiffeHellmanKeys>;

  static create(
    delegate: EncryptionKeysProvider,
    encryptionKeysStore: EncryptionKeysStore = EncryptionKeysStore.createInMemory(),
  ): EncryptionKeysProvider {
    return new CachedEncryptionKeysProvider(delegate, encryptionKeysStore);
  }
}

class CachedEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly delegate: EncryptionKeysProvider,
    private readonly encryptionKeysStore: EncryptionKeysStore,
  ) {
    super();
  }

  private readonly delegateGetPromises: Record<
    string,
    Promise<DiffeHellmanKeys | null>
  > = {};

  async getFailSafe(subject: PublicKey): Promise<DiffeHellmanKeys | null> {
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

  async getFailFast(subject: PublicKey): Promise<DiffeHellmanKeys> {
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
