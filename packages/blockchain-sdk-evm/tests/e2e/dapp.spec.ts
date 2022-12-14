import { Dialect } from '@dialectlabs/sdk';
import { EvmSdkFactory } from '../../src/sdk/sdk';
import { NodeDialectEvmWalletAdapter } from '../../src/wallet-adapter/node-evm-wallet-adapter';

function createSdk() {
  return Dialect.sdk(
    {
      environment: 'local-development',
    },
    EvmSdkFactory.create({
      wallet: NodeDialectEvmWalletAdapter.create(),
    }),
  );
}

describe('Dapps (e2e)', () => {
  test('Can find all dapps using filters', async () => {
    // given
    const dapp1Sdk = createSdk();

    const dapp = await dapp1Sdk.dapps.create({
      name: 'test',
      blockchainType: "EVM"
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

