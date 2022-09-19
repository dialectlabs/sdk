import type { DataServiceHealthApi } from '@data-service-api/data-service-health-api';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { TokenProvider } from '@auth/token-provider';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/signers/ed25519-token-signer';
import { DataServiceApi } from '@data-service-api/data-service-api';

describe('Data service health api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';
  let healthApi: DataServiceHealthApi;
  let wallet: DialectWalletAdapterWrapper;

  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    healthApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(new DialectWalletAdapterEd25519TokenSigner(wallet)),
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
