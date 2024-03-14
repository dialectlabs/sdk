
import { Ed25519TokenSigner } from './ed25519-token-signer';
import type { AuthenticationFacade } from '../authentication-facade';
import { Ed25519AuthenticationFacadeFactory } from './ed25519-authentication-facade-factory';
import type { TokenBody } from '../auth.interface';
import { Ed25519PublicKey } from './ed25519-public-key';
import { generateEd25519Keypair } from './utils';

describe('ed25519 token tests', () => {
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    const keypair = generateEd25519Keypair();
    const signer = new Ed25519TokenSigner(keypair);
    authenticationFacade = new Ed25519AuthenticationFacadeFactory(signer).get();
  });

  test('when not expired validation returns true', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      100,
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
      -100,
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
      6 * 60,
    );
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const compromisedSub = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    ).toString();
    // then
    const compromisedBody: TokenBody = {
      ...token.body,
      sub: compromisedSub,
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

  test('subject and signer may be different', async () => {
    // when
    const signerKeypair = generateEd25519Keypair();
    const subjectPublicKey = new Ed25519PublicKey(
      generateEd25519Keypair().publicKey,
    );
    const signerPublicKey = new Ed25519PublicKey(signerKeypair.publicKey);
    const signer = new Ed25519TokenSigner(
      signerKeypair,
      signerPublicKey,
      subjectPublicKey.toString(),
    );
    authenticationFacade = new Ed25519AuthenticationFacadeFactory(signer).get();
    // when
    const token = await authenticationFacade.generateToken(
      100,
    );
    // then
    expect(token.body.sub_jwk).not.toBe(token.body.sub);
    expect(token.body.sub).toBe(subjectPublicKey.toString());
    expect(token.body.sub_jwk).toBe(signerPublicKey.toString());
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('sub_jwk is optional', async () => {
    // when
    const signerKeypair = generateEd25519Keypair();
    const signerPublicKey = new Ed25519PublicKey(signerKeypair.publicKey);
    const signer = new Ed25519TokenSigner(signerKeypair, null!);
    authenticationFacade = new Ed25519AuthenticationFacadeFactory(signer).get();
    // when
    const token = await authenticationFacade.generateToken(
     100,
    );
    // then
    expect(token.body.sub).toBe(signerPublicKey.toString());
    expect(token.body.sub_jwk).toBeUndefined();
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });
});
