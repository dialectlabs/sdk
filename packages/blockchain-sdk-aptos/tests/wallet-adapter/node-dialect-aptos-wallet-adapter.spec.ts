import { NodeDialectAptosWalletAdapter } from '../../src';
import { HexString } from 'aptos';

describe('dialect node aptos wallet adapter', () => {
  it('should sign message correctly', async () => {
    // given
    const privateKey = new HexString(
      '0x7b2f931e339946505eeb4e61de27be5c9beba488b27de7cd90180a6a2ba5190c',
    );
    const adapter = NodeDialectAptosWalletAdapter.create(
      privateKey.toUint8Array(),
    );
    // when
    const signed = await adapter.signMessage('test');
    // then
    // based on wallet-tester from git@github.com:hippospace/aptos-wallet-adapter.git and pontem wallet
    const expected =
      '0x190e37345f794445262080c9fc4c3630dcbaec477b36a6f1d8976868b453c2b69d4b7cb67d8e34c5a2120c9a765394410d0e0d802985bdd0dd7a04daac4bf60d';
    expect(signed).toEqual(expected);
  });
});
