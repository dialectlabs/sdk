import { Keypair } from '@solana/web3.js';
import { Duration } from 'luxon';
import { DialectSolanaWalletAdapterWrapper } from '../../../src/wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type {
  AccountAddress,
  AuthenticationFacade,
  PublicKey,
  TokenBody,
} from '@dialectlabs/sdk';
import { Ed25519PublicKey, generateEd25519Keypair } from '@dialectlabs/sdk';
import {
  NodeDialectSolanaWalletAdapter,
  SolanaEd25519AuthenticationFacadeFactory,
} from '../../../src';
import {
  DialectWalletAdapterSolanaEd25519TokenSigner,
  SolanaEd25519TokenSigner,
} from '../../../src/auth/ed25519/solana-ed25519-token-signer';

describe('solana ed25519 token tests', () => {
  let wallet: DialectSolanaWalletAdapterWrapper;
  let walletKeypair: Keypair;
  let signer: SolanaEd25519TokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    walletKeypair = Keypair.generate();
    wallet = new DialectSolanaWalletAdapterWrapper(
      NodeDialectSolanaWalletAdapter.create(walletKeypair),
    );
    signer = new DialectWalletAdapterSolanaEd25519TokenSigner(wallet);
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

  test('subject and subject public are same', async () => {
    // when
    const signer = new DialectWalletAdapterSolanaEd25519TokenSigner(wallet);
    authenticationFacade = new SolanaEd25519AuthenticationFacadeFactory(
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

  test('subject and subject public cannot be different if defined', async () => {
    // when
    const subjectPublicKey = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    );
    const signer = new TestDialectWalletAdapterSolanaEd25519TokenSigner(
      wallet,
      subjectPublicKey.toString(),
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

  test('subject public key is optional', async () => {
    // when
    const signer = new TestDialectWalletAdapterSolanaEd25519TokenSigner(
      wallet,
      wallet.publicKey.toBase58(),
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

class TestDialectWalletAdapterSolanaEd25519TokenSigner extends DialectWalletAdapterSolanaEd25519TokenSigner {
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
