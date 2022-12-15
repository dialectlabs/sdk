import { Dialect } from '@dialectlabs/sdk';
import { AptosSdkFactory, NodeDialectAptosWalletAdapter } from '../../src';
import { AptosAccount } from 'aptos';

function createSdk() {
  return Dialect.sdk(
    {
      environment: 'local-development',
    },
    AptosSdkFactory.create({
      wallet: NodeDialectAptosWalletAdapter.create(
        new AptosAccount().signingKey.secretKey,
      ),
    }),
  );
}

describe('Dapps (e2e)', () => {
  test('Can find all dapps using filters', async () => {
    // given
    const dapp1Sdk = createSdk();
    const dapp = await dapp1Sdk.dapps.create({
      name: 'test',
      blockchainType: 'APTOS',
    });
    // when
    const sdk = createSdk();
    const allVerifiedDapps = (
      await sdk.dapps.findAll({
        verified: true,
      })
    ).map((it) => it.address);
    const allNotVerifiedDapps = (
      await sdk.dapps.findAll({
        verified: false,
      })
    ).map((it) => it.address);
    // then
    expect(allNotVerifiedDapps).toMatchObject(
      expect.arrayContaining([dapp.address]),
    );
    expect(allVerifiedDapps).toMatchObject(
      expect.not.arrayContaining([dapp.address]),
    );
  });
});
