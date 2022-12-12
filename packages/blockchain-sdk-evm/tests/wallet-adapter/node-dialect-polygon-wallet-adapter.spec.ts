import { NodeDialectEvmWalletAdapter } from '../../src/wallet-adapter/node-evm-wallet-adapter';

describe('dialect node polygon wallet adapter', () => {
    it('should sign message correctly', async () => {
        // given
        const privateKey = "dd4b7127f4601d376168ceb7107e6de8c9d67b4de2efef0b09557efe2043eadb"
        const adapter = NodeDialectEvmWalletAdapter.create(privateKey);
        // when
        const signed = await adapter.sign('test');

        const expected =
            '0xdd45f7653035a7b946121c940af7b9ec3b74e18b455c47b56e939853c67e7f162010f22d0f85d7883415acb58cd00cc230122551701817d1fcde83c7964e5a961b';
        expect(signed.signature).toEqual(expected);
    });
});
