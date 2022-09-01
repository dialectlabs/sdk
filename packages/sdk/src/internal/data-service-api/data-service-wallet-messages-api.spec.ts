import { TokenProvider } from '../../auth/token-provider';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceApi } from './data-service-api';
import type { DataServiceWalletMessagesApi } from './data-service-wallet-messages-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../../auth/signers/ed25519-token-signer';

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
