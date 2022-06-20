import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceApi } from '@data-service-api/data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';
import type { DataServiceWalletDappAddressesApi } from '@data-service-api/data-service-wallet-dapp-addresses-api';

describe('Data service wallet addresses api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let wallet: DialectWalletAdapterWrapper;
  let walletDappAddresses: DataServiceWalletDappAddressesApi;

  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    walletDappAddresses = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(wallet)),
    ).walletDappAddresses;
  });
});
