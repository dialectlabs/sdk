import { NodeDialectWalletAdapter } from '@wallet-adapter/node-dialect-wallet-adapter';
import { Duration } from 'luxon';
import { AuthTokensImpl } from './token-utils';
import { Keypair } from '@solana/web3.js';
import type { AuthTokens, TokenBody } from '@auth/auth.interface';
import {
  DialectWalletAdapterEd25519TokenSigner,
  Ed25519TokenSigner,
} from '@auth/signers/ed25519-token-signer';
import { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import {
  DialectWalletAdapterSolanaTxTokenSigner,
  SolanaTxTokenSigner,
} from '@auth/signers/solana-tx-token-signer';

describe('ed25519 token tests', () => {
  let wallet: DialectWalletAdapterWrapper;
  let signer: Ed25519TokenSigner;
  let tokenUtils: AuthTokens;
  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
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

describe('solana-tx token tests', () => {
  let wallet: DialectWalletAdapterWrapper;
  let signer: SolanaTxTokenSigner;
  let tokenUtils: AuthTokens;
  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    signer = new DialectWalletAdapterSolanaTxTokenSigner(wallet);
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
});
