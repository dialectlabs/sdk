import { Dialect } from '@dialectlabs/sdk';
import { PolygonSdkFactory } from '../../src/sdk/sdk';
import { NodeDialectPolygonWalletAdapter } from '../../wallet-adapter/node-dialect-polygon-wallet-adapter';


function createSdk() {
    return Dialect.sdk(
        {
            environment: 'local-development',
        },
        PolygonSdkFactory.create({
            wallet: NodeDialectPolygonWalletAdapter.create("5c5e2a8fa477f1e0babe2c425c9e936dc00441fccee9913fd81194f18bf535c5"),
        }),
    );
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

