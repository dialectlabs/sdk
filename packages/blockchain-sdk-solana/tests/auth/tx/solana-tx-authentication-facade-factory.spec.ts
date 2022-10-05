import { DialectSolanaWalletAdapterWrapper } from '../../../src/wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import {
  NodeDialectSolanaWalletAdapter,
  SolanaEd25519AuthenticationFacadeFactory,
} from '../../../src';
import {
  DialectWalletAdapterSolanaTxTokenSigner,
  SolanaTxTokenSigner,
} from '../../../src/auth/tx/solana-tx-token-signer';

import { SolanaTxAuthenticationFacadeFactory } from '../../../src/auth/tx/solana-tx-authentication-facade-factory';
import { Duration } from 'luxon';
import type { AuthenticationFacade } from '@dialectlabs/sdk';
import {
  AccountAddress,
  Ed25519PublicKey,
  generateEd25519Keypair,
  PublicKey,
} from '@dialectlabs/sdk';

describe('solana-tx token tests', () => {
  let wallet: DialectSolanaWalletAdapterWrapper;
  let signer: SolanaTxTokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectSolanaWalletAdapterWrapper(
      NodeDialectSolanaWalletAdapter.create(),
    );
    signer = new DialectWalletAdapterSolanaTxTokenSigner(wallet);
    authenticationFacade = new SolanaTxAuthenticationFacadeFactory(
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

  test('subject and subject public are same', async () => {
    // when
    const signer = new DialectWalletAdapterSolanaTxTokenSigner(wallet);
    authenticationFacade = new SolanaTxAuthenticationFacadeFactory(
      signer,
    ).get();
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    expect(token.body.sub).toBe(wallet.publicKey.toString());
    expect(token.body.sub_jwk).toBe(wallet.publicKey.toString());
  });

  test('subject and subject public key may not be different', async () => {
    // when
    const subjectPublicKey = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    );
    const signer = new TestDialectWalletAdapterSolanaTxTokenSigner(
      wallet,
      subjectPublicKey.toString(),
      wallet.publicKey,
    );
    authenticationFacade = new SolanaTxAuthenticationFacadeFactory(
      signer,
    ).get();
    // when / then
    await expect(
      authenticationFacade.generateToken(Duration.fromObject({ seconds: 100 })),
    ).rejects.toThrowError();
  });

  test('subject public key is optional', async () => {
    // when
    const signer = new TestDialectWalletAdapterSolanaTxTokenSigner(
      wallet,
      wallet.publicKey.toBase58(),
      undefined!,
    );
    authenticationFacade = new SolanaTxAuthenticationFacadeFactory(
      signer,
    ).get();
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    expect(token.body.sub).toBe(wallet.publicKey.toString());
    expect(token.body.sub_jwk).toBeUndefined();
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });
});

class TestDialectWalletAdapterSolanaTxTokenSigner extends DialectWalletAdapterSolanaTxTokenSigner {
  constructor(
    wallet: DialectSolanaWalletAdapterWrapper,
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
