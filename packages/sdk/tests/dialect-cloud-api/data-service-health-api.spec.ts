import type { DataServiceHealthApi } from '../../src/dialect-cloud-api/data-service-health-api';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import { TokenProvider } from '../../src/auth/token-provider';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import type { AccountAddress } from '../../src/auth/auth.interface';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

describe('Data service health api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';
  let healthApi: DataServiceHealthApi;
  let walletAddress: AccountAddress;

  beforeEach(() => {
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    walletAddress = authenticationFacade.subject();
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    healthApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
    ).health;
  });

  test('database is healthy', async () => {
    const healthCheckResult = await healthApi.healthCheck();
    const expectedResult = {
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    };
    expect(healthCheckResult).toMatchObject(expectedResult);
  });
});
