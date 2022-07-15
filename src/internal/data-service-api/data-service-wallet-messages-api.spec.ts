import { DataServiceApi } from './data-service-api';
import { TokenProvider } from '@auth/internal/token-provider';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/signers/ed25519-token-signer';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import type { DataServiceWalletMessagesApi } from '@data-service-api/data-service-wallet-messages-api';

describe('Data service dapps api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappWallet: DialectWalletAdapterWrapper;
  let dappsApi: DataServiceWalletMessagesApi;

  beforeEach(() => {
    dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    dappsApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(dappWallet),
      ),
    ).walletMessages;
  });

  test('can find all dapp messages', async () => {
    // when
    const addresses1 = await dappsApi.findAllDappMessages();
    const addresses2 = await dappsApi.findAllDappMessages({
      take: 1,
    });
    const addresses3 = await dappsApi.findAllDappMessages({
      skip: 3,
    });
    expect(addresses1).toMatchObject([]);
    expect(addresses2).toMatchObject([]);
    expect(addresses3).toMatchObject([]);
  });
});
