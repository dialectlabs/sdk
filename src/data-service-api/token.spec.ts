import { EmbeddedDialectWalletAdapter } from '../wallet';
import { Duration } from 'luxon';
import { Token, TokenBody } from './token';
import { Keypair } from '@solana/web3.js';

describe('token tests', () => {
  test('when not expired validation returns true', async () => {
    const wallet: EmbeddedDialectWalletAdapter =
      EmbeddedDialectWalletAdapter.create();
    // given
    const token = await Token.generate(
      wallet,
      Duration.fromObject({ seconds: 100 }),
    );
    // when
    const isValid = Token.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = Token.parse(token.rawValue);
    const isParsedTokenValid = Token.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('when expired validation returns false', async () => {
    const wallet: EmbeddedDialectWalletAdapter =
      EmbeddedDialectWalletAdapter.create();
    // given
    const token = await Token.generate(
      wallet,
      Duration.fromObject({ seconds: -100 }),
    );
    // when
    const isValid = Token.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = Token.parse(token.rawValue);
    const isParsedTokenValid = Token.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when sub compromised returns false', async () => {
    const wallet: EmbeddedDialectWalletAdapter =
      EmbeddedDialectWalletAdapter.create();
    // given
    const token = await Token.generate(
      wallet,
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = Token.isValid(token);
    expect(isValid).toBeTruthy();
    // when
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
    const wallet: EmbeddedDialectWalletAdapter =
      EmbeddedDialectWalletAdapter.create();
    // given
    const token = await Token.generate(
      wallet,
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = Token.isValid(token);
    expect(isValid).toBeTruthy();
    // when
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
