import {
  DataServiceApiFactory,
  DataServiceWalletsApiClientV1,
  Ed25519AuthenticationFacadeFactory,
  Ed25519TokenSigner,
  TokenProvider,
} from '../../src';
import type { DataServiceDappNotificationSubscriptionsApi } from '../../src/dialect-cloud-api/data-service-dapp-notification-subscriptions-api';
import type { DappDto } from '../../src/dialect-cloud-api/data-service-dapps-api';
import { BlockchainType } from '@dialectlabs/sdk';

describe('Data service dapp notification types api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let api: DataServiceDappNotificationSubscriptionsApi;
  let dapp: DappDto;

  beforeEach(async () => {
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(baseUrl);
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
      blockchainType: BlockchainType.SOLANA,
    });
  });

  test('can find all', async () => {
    // given
    const all = await api.findAll();
    // when
    expect(all).toMatchObject([]);
  });
});
