import type { DataServiceHealthApi } from './data-service-health-api';
import { DataServiceApi } from './data-service-api';
import { TokenProvider } from '../core/auth/token-provider';
import { Ed25519AuthenticationFacadeFactory } from '../core/auth/ed25519/ed25519-authentication-facade-factory';
import { Ed25519TokenSigner } from '../core/auth/ed25519/ed25519-token-signer';
import type { AccountAddress } from '../core/auth/auth.interface';

describe('Data service health api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';
  let healthApi: DataServiceHealthApi;
  let walletAddress: AccountAddress;

  beforeEach(() => {
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    walletAddress = authenticationFacade.subject();
    healthApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(authenticationFacade),
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
