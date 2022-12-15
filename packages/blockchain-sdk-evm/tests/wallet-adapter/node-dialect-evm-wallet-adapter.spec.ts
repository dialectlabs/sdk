import { NodeDialectEvmWalletAdapter } from '../../src/wallet-adapter/node-evm-wallet-adapter';

describe('dialect node evm wallet adapter', () => {
    it('should sign message correctly', async () => {
        // given
        const privateKey = "5c5e2a8fa477f1e0babe2c425c9e936dc00441fccee9913fd81194f18bf535c5"
        const adapter = NodeDialectEvmWalletAdapter.create(privateKey);
        // when
        const signed = await adapter.sign('test');

        // https://www.myetherwallet.com/wallet/sign can test singature heres
        const expected =
            '0xd0efcaf9365c7c304d6c2d2615718409945fa2699a60fc58ca4178b374e26d3c5d52da338e95b81f8872ce39d809c6527c89c2162aa51e76ea5005cbbd26bc211b';
        expect(signed).toEqual(expected);
    });
});
