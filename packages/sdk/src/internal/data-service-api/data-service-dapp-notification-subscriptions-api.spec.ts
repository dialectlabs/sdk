import { TokenProvider } from '../../auth/token-provider';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceApi } from './data-service-api';
import type { DataServiceDappNotificationSubscriptionsApi } from './data-service-dapp-notification-subscriptions-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../../auth/signers/ed25519-token-signer';
import type { DappDto } from './data-service-dapps-api';

describe('Data service dapp notification types api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappWallet: DialectWalletAdapterWrapper;
  let api: DataServiceDappNotificationSubscriptionsApi;
  let dapp: DappDto;

  beforeEach(async () => {
    dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    const dataServiceApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(dappWallet),
      ),
    );
    api = dataServiceApi.dappNotificationSubscriptions;
    dapp = await dataServiceApi.dapps.create({
      name: 'test-dapp' + new Date().toString(),
    });
  });

  test('can find all', async () => {
    // given
    const all = await api.findAll();
    // when
    expect(all).toMatchObject([]);
  });
});
