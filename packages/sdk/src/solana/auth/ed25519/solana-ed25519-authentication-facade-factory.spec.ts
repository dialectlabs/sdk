import { Keypair } from '@solana/web3.js';
import { Duration } from 'luxon';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import type { AuthenticationFacade } from '../../../core/auth/authentication-facade';
import type { Ed25519TokenSigner } from '../../../core/auth/ed25519/ed25519-token-signer';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import { DialectWalletAdapterEd25519TokenSigner } from './solana-ed25519-token-signer';
import type { TokenBody } from '../../../core/auth/auth.interface';
import { generateEd25519Keypair } from '../../../core/auth/ed25519/utils';
import { Ed25519PublicKey } from '../../../core/auth/ed25519/ed25519-public-key';
import { SolanaEd25519AuthenticationFacadeFactory } from './solana-ed25519-authentication-facade-factory';
import type { PublicKey } from '../../../core/auth/auth.interface';

describe('solana ed25519 token tests', () => {
  let wallet: DialectWalletAdapterWrapper;
  let signer: Ed25519TokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    signer = new DialectWalletAdapterEd25519TokenSigner(wallet);
    authenticationFacade = new SolanaEd25519AuthenticationFacadeFactory(
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
      sub: new Keypair().publicKey.toBase58(),
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

  test('subject and subject public key may not be different', async () => {
    // when
    const subjectPublicKey = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    );
    const signer = new TestDialectWalletAdapterEd25519TokenSigner(
      wallet,
      subjectPublicKey,
      wallet.publicKey,
    );
    authenticationFacade = new SolanaEd25519AuthenticationFacadeFactory(
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

  test('subject public key may be absent', async () => {
    // when
    const signer = new TestDialectWalletAdapterEd25519TokenSigner(
      wallet,
      wallet.publicKey,
      undefined!,
    );
    authenticationFacade = new SolanaEd25519AuthenticationFacadeFactory(
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

class TestDialectWalletAdapterEd25519TokenSigner extends DialectWalletAdapterEd25519TokenSigner {
  constructor(
    wallet: DialectWalletAdapterWrapper,
    private readonly _subject: PublicKey,
    private readonly _subjectPublicKey: PublicKey,
  ) {
    super(wallet);
  }

  override get subject(): PublicKey {
    return this._subject;
  }

  override get subjectPublicKey(): PublicKey {
    return this._subjectPublicKey;
  }
}