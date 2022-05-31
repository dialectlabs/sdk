import { NodeDialectWalletAdapter } from './node-dialect-wallet-adapter';
import { Duration } from 'luxon';
import {
  DialectWalletEd25519TokenSigner,
  Ed25519TokenSigner,
  Token,
  TokenBody,
} from './token';
import { Keypair } from '@solana/web3.js';

describe('token tests', () => {
  let wallet: NodeDialectWalletAdapter;
  let signer: Ed25519TokenSigner;
  beforeEach(() => {
    wallet = NodeDialectWalletAdapter.create();
    signer = new DialectWalletEd25519TokenSigner(wallet);
  });

  test('when not expired validation returns true', async () => {
    // when
    const token = await Token.generate(
      signer,
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    const isValid = Token.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = Token.parse(token.rawValue);
    const isParsedTokenValid = Token.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('when expired validation returns false', async () => {
    // when
    const token = await Token.generate(
      signer,
      Duration.fromObject({ seconds: -100 }),
    );
    // then
    const isValid = Token.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = Token.parse(token.rawValue);
    const isParsedTokenValid = Token.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when sub compromised returns false', async () => {
    // when
    const token = await Token.generate(
      signer,
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = Token.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub: new Keypair().publicKey.toBase58(),
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = Token.parse(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = Token.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when exp compromised returns false', async () => {
    // when
    const token = await Token.generate(
      signer,
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = Token.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      exp: token.body.exp + 10000,
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = Token.parse(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = Token.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });
});
