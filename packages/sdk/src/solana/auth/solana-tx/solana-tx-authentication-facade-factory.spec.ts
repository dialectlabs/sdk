import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import {
  DialectWalletAdapterSolanaTxTokenSigner,
  SolanaTxTokenSigner,
} from './solana-tx-token-signer';
import { Duration } from 'luxon';
import type { AuthenticationFacade } from '../../../core/auth/authentication-facade';
import { SolanaTxAuthenticationFacadeFactory } from './solana-tx-authentication-facade-factory';
import { generateEd25519Keypair } from '../../../core/auth/ed25519/utils';
import { Ed25519PublicKey } from '../../../core/auth/ed25519/ed25519-public-key';
import type {
  AccountAddress,
  PublicKey,
} from '../../../core/auth/auth.interface';

describe('solana-tx token tests', () => {
  let wallet: DialectWalletAdapterWrapper;
  let signer: SolanaTxTokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
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
    wallet: DialectWalletAdapterWrapper,
    private readonly _subject: AccountAddress,
  ) {
    super(wallet);
  }

  override get subject(): AccountAddress {
    return this._subject;
  }
}
