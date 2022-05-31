import { NodeDialectWalletAdapter } from '../../node-dialect-wallet-adapter';
import { Duration } from 'luxon';
import {
  DialectWalletEd25519TokenSigner,
  AuthTokenUtilsImpl,
} from './token-utils';
import { Keypair } from '@solana/web3.js';
import type {
  Ed25519TokenSigner,
  TokenBody,
  AuthTokenUtils,
} from '../../token.interface';

describe('token tests', () => {
  let wallet: NodeDialectWalletAdapter;
  let signer: Ed25519TokenSigner;
  let tokenUtils: AuthTokenUtils;
  beforeEach(() => {
    wallet = NodeDialectWalletAdapter.create();
    signer = new DialectWalletEd25519TokenSigner(wallet);
    tokenUtils = new AuthTokenUtilsImpl();
  });

  test('when not expired validation returns true', async () => {
    // when
    const token = await tokenUtils.generate(
      signer,
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    const isValid = tokenUtils.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = tokenUtils.parse(token.rawValue);
    const isParsedTokenValid = tokenUtils.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('when expired validation returns false', async () => {
    // when
    const token = await tokenUtils.generate(
      signer,
      Duration.fromObject({ seconds: -100 }),
    );
    // then
    const isValid = tokenUtils.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = tokenUtils.parse(token.rawValue);
    const isParsedTokenValid = tokenUtils.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when sub compromised returns false', async () => {
    // when
    const token = await tokenUtils.generate(
      signer,
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = tokenUtils.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub: new Keypair().publicKey.toBase58(),
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = tokenUtils.parse(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = tokenUtils.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when exp compromised returns false', async () => {
    // when
    const token = await tokenUtils.generate(
      signer,
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = tokenUtils.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      exp: token.body.exp + 10000,
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = tokenUtils.parse(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = tokenUtils.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });
});
