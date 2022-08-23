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
    const dapp = await dapp1Sdk.dapps.create({
      name: 'test',
    });
    // when
    const sdk = createSdk();
    const allVerifiedDapps = (
      await sdk.dapps.findAll({
        verified: true,
      })
    ).map((it) => it.publicKey);
    const allNotVerifiedDapps = (
      await sdk.dapps.findAll({
        verified: false,
      })
    ).map((it) => it.publicKey);
    // then
    expect(allNotVerifiedDapps).toMatchObject(
      expect.arrayContaining([dapp.publicKey]),
    );
    expect(allVerifiedDapps).toMatchObject(
      expect.not.arrayContaining([dapp.publicKey]),
    );
  });
});
