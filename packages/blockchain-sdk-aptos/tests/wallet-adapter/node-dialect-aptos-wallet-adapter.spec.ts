import {
  NodeDialectAptosWalletAdapter,
  SignMessagePayload,
  SignMessageResponse,
} from '../../src';
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

  it('should sign message payload correctly', async () => {
    // given
    const privateKey = new HexString(
      '0x8939e0a348c54d6bda2781eaa7e03081c1fed15060f531b88d642fea0ea698e6',
    );
    const adapter = NodeDialectAptosWalletAdapter.create(
      privateKey.toUint8Array(),
    );
    // when
    const payload: SignMessagePayload = {
      nonce: 'encoded_in_message',
      message: 'test',
    };
    const signed = await adapter.signMessagePayload(payload);
    // then
    // based on wallet-tester from git@github.com:hippospace/aptos-wallet-adapter.git and martian wallet
    const expected: SignMessageResponse = {
      fullMessage: `APTOS\nmessage: ${payload.message}\nnonce: ${payload.nonce}`,
      message: payload.message,
      nonce: payload.nonce,
      prefix: 'APTOS',
      signature:
        '0x98ec3ab75bb1a180bc9bd396f30705196b020846cb675c2f6ae1f5d9312bb96f7820064d0b48f30aba9a802a064849cc2fb7cfddcbfeb66de24085eea2221a03',
    };
    expect(signed).toStrictEqual(expected);
  });
});
