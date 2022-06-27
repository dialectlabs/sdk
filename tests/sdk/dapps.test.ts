import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { Backend, Dialect } from '@sdk/sdk.interface';

function createSdk() {
  return Dialect.sdk({
    wallet: NodeDialectWalletAdapter.create(),
    backends: [Backend.DialectCloud],
    environment: 'local-development',
  });
}

describe('Dapps (e2e)', () => {
  test('Can find all dapps using filters', async () => {
    // given
    const dapp1Sdk = createSdk();
    const allDappsBefore = await dapp1Sdk.dapps.findAll();
    await dapp1Sdk.dapps.create({
      name: 'test',
    });
    const dapp2Sdk = createSdk();
    await dapp2Sdk.dapps.create({
      name: 'test2',
    });
    // when
    const sdk = createSdk();
    const allDapps = await sdk.dapps.findAll();
    const allVerifiedDapps = await sdk.dapps.findAll({
      verified: true,
    });
    const allNotVerifiedDapps = await sdk.dapps.findAll({
      verified: false,
    });
    // then
    expect(allDapps.length).toBe(allDappsBefore.length + 2);
    expect(allNotVerifiedDapps.length).toBe(allDappsBefore.length + 2);
    expect(allVerifiedDapps.length).toBe(0);
  });
});
