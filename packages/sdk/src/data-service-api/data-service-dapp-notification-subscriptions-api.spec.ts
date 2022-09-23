import { TokenProvider } from '../core/auth/token-provider';
import { DataServiceApi } from './data-service-api';
import type { DataServiceDappNotificationSubscriptionsApi } from './data-service-dapp-notification-subscriptions-api';
import type { DappDto } from './data-service-dapps-api';
import { Ed25519AuthenticationFacadeFactory } from '../core/auth/ed25519/ed25519-authentication-facade-factory';
import { Ed25519TokenSigner } from '../core/auth/ed25519/ed25519-token-signer';

describe('Data service dapp notification types api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let api: DataServiceDappNotificationSubscriptionsApi;
  let dapp: DappDto;

  beforeEach(async () => {
    const dataServiceApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new Ed25519AuthenticationFacadeFactory(new Ed25519TokenSigner()).get(),
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
