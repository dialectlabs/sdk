import { Keypair } from '@solana/web3.js';
import { Duration } from 'luxon';
import { DialectSolanaWalletAdapterWrapper } from '../../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type { AuthenticationFacade } from '../../../core/auth/authentication-facade';
import { NodeDialectSolanaWalletAdapter } from '../../wallet-adapter/node-dialect-solana-wallet-adapter';
import {
  DialectWalletAdapterEd25519TokenSigner,
  SolanaEd25519TokenSigner,
} from './solana-ed25519-token-signer';
import type {
  AccountAddress,
  PublicKey,
  TokenBody,
} from '../../../core/auth/auth.interface';
import { generateEd25519Keypair } from '../../../core/auth/ed25519/utils';
import { Ed25519PublicKey } from '../../../core/auth/ed25519/ed25519-public-key';
import { SolanaEd25519AuthenticationFacadeFactory } from './solana-ed25519-authentication-facade-factory';

describe('solana ed25519 token tests', () => {
  let wallet: DialectSolanaWalletAdapterWrapper;
  let signer: SolanaEd25519TokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectSolanaWalletAdapterWrapper(
      NodeDialectSolanaWalletAdapter.create(),
    );
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

  test('subject and subject public must be same if defined', async () => {
    // when
    const subjectPublicKey = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    );
    const signer = new TestDialectWalletAdapterEd25519TokenSigner(
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
    const signer = new TestDialectWalletAdapterEd25519TokenSigner(
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

class TestDialectWalletAdapterEd25519TokenSigner extends DialectWalletAdapterEd25519TokenSigner {
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
