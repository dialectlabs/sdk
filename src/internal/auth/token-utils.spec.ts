import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { Duration } from 'luxon';
import { AuthTokensImpl } from './token-utils';
import { Keypair } from '@solana/web3.js';
import type {
  AuthTokens,
  Ed25519TokenSigner,
  TokenBody,
} from '@auth/auth.interface';
import { DialectWalletAdapterEd25519TokenSigner } from '@auth/auth.interface';

describe('token tests', () => {
  let wallet: NodeDialectWalletAdapter;
  let signer: Ed25519TokenSigner;
  let tokenUtils: AuthTokens;
  beforeEach(() => {
    wallet = NodeDialectWalletAdapter.create();
    signer = new DialectWalletAdapterEd25519TokenSigner(wallet);
    tokenUtils = new AuthTokensImpl();
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
