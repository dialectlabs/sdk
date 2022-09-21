import { TokenProvider } from '../core/auth/token-provider';
import { DataServiceApi } from './data-service-api';
import type { DataServiceWalletMessagesApi } from './data-service-wallet-messages-api';
import { TestEd25519AuthenticationFacadeFactory } from '../core/auth/ed25519/test-ed25519-authentication-facade-factory';
import type { AccountAddress } from '../core/auth/auth.interface';
import { TestEd25519TokenSigner } from '../core/auth/ed25519/test-ed25519-token-signer';

describe('Data service dapps api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappAccountAddress: AccountAddress;
  let dappsApi: DataServiceWalletMessagesApi;

  beforeEach(() => {
    const authenticationFacade = new TestEd25519AuthenticationFacadeFactory(
      new TestEd25519TokenSigner(),
    ).get();
    dappAccountAddress = authenticationFacade.subject();
    dappsApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(authenticationFacade),
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
