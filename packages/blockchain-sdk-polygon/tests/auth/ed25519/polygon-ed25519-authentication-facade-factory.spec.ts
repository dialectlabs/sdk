import { DialectPolygonWalletAdapterWrapper } from "../../../wallet-adapter/dialect-polygon-wallet-adapter-wrapper";
import { Duration } from 'luxon';
import type { AuthenticationFacade, TokenBody } from '@dialectlabs/sdk';
import { NodeDialectPolygonWalletAdapter } from "../../../wallet-adapter/node-dialect-polygon-wallet-adapter";
import {
  DialectWalletAdapterPolygonEd25519TokenSigner,
  PolygonEd25519TokenSigner
} from "../../../auth/polygon-ed25519-token-signer";
import { PolygonEd25519AuthenticationFacadeFactory } from "../../../auth/polygon-ed25519-authentication-facade-factory";
import Web3 from "web3";

describe('polygon ed25519 token tests', () => {
  let wallet: DialectPolygonWalletAdapterWrapper;
  let signer: PolygonEd25519TokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectPolygonWalletAdapterWrapper(NodeDialectPolygonWalletAdapter.create('5c5e2a8fa477f1e0babe2c425c9e936dc00441fccee9913fd81194f18bf535c5'));
    signer = new DialectWalletAdapterPolygonEd25519TokenSigner(wallet) as any;
    authenticationFacade = new PolygonEd25519AuthenticationFacadeFactory(signer).get();
  });

  test('when not expired validation returns true', async () => {
    const token = await authenticationFacade.generateToken(Duration.fromObject({ seconds: 100 }));
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('when expired validation returns false', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: -100 }),
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
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub: new Web3().eth.accounts.create("compormised").address,
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
      Duration.fromObject({ minutes: 5 }),
    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub_jwk: new Web3().eth.accounts.create("compormised").address,
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
      Duration.fromObject({ minutes: 5 }),
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
})
