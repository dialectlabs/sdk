import { DataServiceApi } from './data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type { DataServiceWalletAddressesApi } from '@data-service-api/data-service-wallet-addresses-api';

describe('Data service wallet addresses api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let wallet: DialectWalletAdapterWrapper;
  let walletAddresses: DataServiceWalletAddressesApi;

  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    walletAddresses = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(wallet)),
    ).walletAddresses;
  });
});
