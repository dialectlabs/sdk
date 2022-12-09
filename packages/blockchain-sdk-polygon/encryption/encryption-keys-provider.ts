import {
    DiffeHellmanKeys,
    EncryptionKeysProvider,
    UnsupportedOperationError,
} from '@dialectlabs/sdk';
import type { DialectPolygonWalletAdapterWrapper } from '../wallet-adapter/dialect-polygon-wallet-adapter-wrapper';

export class DialectPolygonWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
    constructor(
        private readonly dialectWalletAdapter: DialectPolygonWalletAdapterWrapper,
    ) {
        super();
    }

    async getFailSafe(): Promise<DiffeHellmanKeys | null> {
        return null;
    }

    getFailFast(): Promise<DiffeHellmanKeys> {
        throw new UnsupportedOperationError(
            'Encryption not supported',
            'Wallet does not support encryption yet',
        );
    }

    isAvailable(): boolean {
        return false;
    }
}
