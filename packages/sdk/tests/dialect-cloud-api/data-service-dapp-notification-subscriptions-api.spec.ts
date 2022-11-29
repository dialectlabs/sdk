import { TokenProvider } from '../../src/auth/token-provider';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import type { DataServiceDappNotificationSubscriptionsApi } from '../../src/dialect-cloud-api/data-service-dapp-notification-subscriptions-api';
import type { DappDto } from '../../src/dialect-cloud-api/data-service-dapps-api';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

describe('Data service dapp notification types api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let api: DataServiceDappNotificationSubscriptionsApi;
  let dapp: DappDto;

  beforeEach(async () => {
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    const dataServiceApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(
        new Ed25519AuthenticationFacadeFactory(new Ed25519TokenSigner()).get(),
        dataServiceWalletsApiV1,
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
