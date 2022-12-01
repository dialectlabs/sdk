import { TokenProvider } from '../../src/auth/token-provider';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import type { DataServiceWalletMessagesApi } from '../../src/dialect-cloud-api/data-service-wallet-messages-api';
import type { AccountAddress } from '../../src/auth/auth.interface';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

describe('Data service dapps api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappAccountAddress: AccountAddress;
  let dappsApi: DataServiceWalletMessagesApi;

  beforeEach(() => {
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    dappAccountAddress = authenticationFacade.subject();
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    dappsApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
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
