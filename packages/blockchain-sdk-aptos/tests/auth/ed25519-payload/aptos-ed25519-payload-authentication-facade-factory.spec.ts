import { Duration } from 'luxon';
import { DialectAptosWalletAdapterWrapper } from '../../../src/wallet-adapter/dialect-aptos-wallet-adapter-wrapper';
import {
  AptosEd25519PayloadTokenSigner,
  DialectWalletAdapterAptosEd25519PayloadTokenSigner,
} from '../../../src/auth/ed25519-payload/aptos-ed25519-payload-token-signer';
import {
  AptosEd25519PayloadAuthenticationFacadeFactory,
  NodeDialectAptosWalletAdapter,
} from '../../../src';
import type {
  AccountAddress,
  AuthenticationFacade,
  PublicKey,
} from '@dialectlabs/sdk';
import { AptosAccount, HexString } from 'aptos';
import { AptosPubKey } from '../../../src/auth/aptos-public-key';

describe('aptos ed25519 payload token tests', () => {
  let wallet: DialectAptosWalletAdapterWrapper;
  let signer: AptosEd25519PayloadTokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectAptosWalletAdapterWrapper(
      NodeDialectAptosWalletAdapter.create(),
    );
    signer = new DialectWalletAdapterAptosEd25519PayloadTokenSigner(wallet);
    authenticationFacade = new AptosEd25519PayloadAuthenticationFacadeFactory(
      signer,
    ).get();
  });

  test('when not expired validation returns true', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: 100 }),
    );
    // then
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

  test('when sub isl compromised returns false', async () => {
    // when
    const wallet = new DialectAptosWalletAdapterWrapper(
      NodeDialectAptosWalletAdapter.create(),
    );
    const subjectPublicKey = new AptosPubKey(
      HexString.ensure(wallet.publicKey),
    );
    const sub = new AptosAccount().address().toString();
    const signer = new TestDialectWalletAdapterAptosEd25519TokenSigner(
      wallet,
      sub,
      subjectPublicKey,
    );
    authenticationFacade = new AptosEd25519PayloadAuthenticationFacadeFactory(
      signer,
    ).get();
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    expect(token.body.sub).toBe(sub);
    expect(token.body.sub_jwk).toBe(subjectPublicKey.toString());
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });
});

class TestDialectWalletAdapterAptosEd25519TokenSigner extends DialectWalletAdapterAptosEd25519PayloadTokenSigner {
  constructor(
    wallet: DialectAptosWalletAdapterWrapper,
    private readonly _subject: AccountAddress,
    private readonly _subjectPublicKey: PublicKey,
  ) {
    super(wallet);
  }

  override get subject(): AccountAddress {
    return this._subject;
  }

  override get subjectPublicKey(): PublicKey {
    return this._subjectPublicKey;
  }
}
