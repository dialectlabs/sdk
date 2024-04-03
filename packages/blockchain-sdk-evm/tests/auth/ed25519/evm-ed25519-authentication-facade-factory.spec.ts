import { DialectEvmWalletAdapterWrapper } from '../../../src/wallet-adapter/dialect-evm-wallet-adapter-wrapper';
import type { AuthenticationFacade, TokenBody } from '@dialectlabs/sdk';
import { NodeDialectEvmWalletAdapter } from '../../../src/wallet-adapter/node-evm-wallet-adapter';
import {
  DialectWalletAdapterEvmEd25519TokenSigner,
  EvmEd25519TokenSigner,
} from '../../../src/auth/evm-ed25519-token-signer';
import { EvmEd25519AuthenticationFacadeFactory } from '../../../src/auth/evm-ed25519-authentication-facade-factory';
import { ethers } from 'ethers';

describe('evm ed25519 token tests', () => {
  let wallet: DialectEvmWalletAdapterWrapper;
  let signer: EvmEd25519TokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectEvmWalletAdapterWrapper(
      NodeDialectEvmWalletAdapter.create(
        ethers.Wallet.createRandom().privateKey,
      ),
    );
    signer = new DialectWalletAdapterEvmEd25519TokenSigner(wallet) as any;
    authenticationFacade = new EvmEd25519AuthenticationFacadeFactory(
      signer,
    ).get();
  });

  test('when not expired validation returns true', async () => {
    const token = await authenticationFacade.generateToken(
      10000,
    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('when expired validation returns false', async () => {
    // when
    const token = await authenticationFacade.generateToken(
     -100 ,
    );
    // then
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when sub compromised returns false', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      5 * 60,
    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub: ethers.Wallet.fromMnemonic(
        'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol',
      ).address,
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = authenticationFacade.parseToken(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = authenticationFacade.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when sub jwk compromised returns false', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      5 * 60,

    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub_jwk: ethers.Wallet.fromMnemonic(
        'announce room limb pattern dry unit scale effort smooth jazz weasel alcohol',
      ).address,
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = authenticationFacade.parseToken(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = authenticationFacade.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });

  test('when exp compromised returns false', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      5 * 60,
    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      exp: token.body.exp + 10000,
    };
    const compromisedBase64Body = btoa(JSON.stringify(compromisedBody));
    const compromisedToken = authenticationFacade.parseToken(
      token.base64Header +
        '.' +
        compromisedBase64Body +
        '.' +
        token.base64Signature,
    );
    const isParsedTokenValid = authenticationFacade.isValid(compromisedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });
});
