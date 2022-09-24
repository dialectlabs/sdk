import { DialectSolanaWalletAdapterWrapper } from '../../../src/wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import { NodeDialectSolanaWalletAdapter } from '../../../src';
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

  test('subject and subject public key may not be different', async () => {
    // when
    const signerKeypair = generateEd25519Keypair();
    const subjectPublicKey = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    ).toString();
    const signer = new TestDialectWalletAdapterSolanaTxTokenSigner(
      wallet,
      subjectPublicKey,
    );
    authenticationFacade = new SolanaTxAuthenticationFacadeFactory(
      signer,
    ).get();
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    expect(token.body.sub).toBe(subjectPublicKey.toString());
    expect(token.body.sub_jwk).toBe(wallet.publicKey.toString());
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });
});

class TestDialectWalletAdapterSolanaTxTokenSigner extends DialectWalletAdapterSolanaTxTokenSigner {
  constructor(
    wallet: DialectSolanaWalletAdapterWrapper,
    private readonly _subject: AccountAddress,
  ) {
    super(wallet);
  }

  override get subject(): AccountAddress {
    return this._subject;
  }
}
