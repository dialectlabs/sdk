import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import type { Duration } from 'luxon';
import { PublicKey } from '@solana/web3.js';
import type {
  AuthTokens,
  Ed25519TokenSigner,
  Token,
  TokenBody,
  TokenHeader,
} from '@auth/auth.interface';

export class AuthTokensImpl implements AuthTokens {
  async generate(signer: Ed25519TokenSigner, ttl: Duration): Promise<Token> {
    const header: TokenHeader = {
      alg: 'ed25519',
      typ: 'JWT',
    };
    const base64Header = btoa(JSON.stringify(header));
    const nowUtcSeconds = new Date().getTime() / 1000;
    const body: TokenBody = {
      sub: signer.subject.toBase58(),
      iat: Math.round(nowUtcSeconds),
      exp: Math.round(nowUtcSeconds + ttl.toMillis() / 1000),
    };
    const base64Body = btoa(JSON.stringify(body));
    const signingPayload = AuthTokensImpl.getSigningPayload(
      base64Header + '.' + base64Body,
    );
    const signature = await signer.sign(signingPayload);
    const base64Signature = util.encodeBase64(signature);
    const rawValue = `${base64Header}.${base64Body}.${base64Signature}`;
    return {
      rawValue,
      body,
      header,
      signature,
      base64Signature: base64Signature,
      base64Body,
      base64Header,
    };
  }

  parse(rawToken: string): Token {
    const parts = rawToken.split('.');
    if (parts.length !== 3) {
      throw new TokenParsingError();
    }
    const [base64Header, base64Body, base64Signature] = parts;
    if (!base64Header || !base64Body || !base64Signature) {
      throw new TokenParsingError();
    }
    try {
      const body = JSON.parse(atob(base64Body)) as TokenBody;
      if (!body.sub || !body.exp) {
        throw new TokenStructureValidationError();
      }
      const header = JSON.parse(atob(base64Header)) as TokenHeader;
      const signature = util.decodeBase64(base64Signature);
      return {
        base64Header,
        base64Body,
        base64Signature,
        rawValue: rawToken,
        header,
        signature,
        body,
      };
    } catch (e) {
      console.log(e);
      throw new TokenParsingError();
    }
  }

  isValid(token: Token) {
    if (!this.isSignatureValid(token)) {
      return false;
    }
    return !this.isExpired(token);
  }

  isSignatureValid(token: Token) {
    const signedPayload = token.base64Header + '.' + token.base64Body;
    const signingPayload = AuthTokensImpl.getSigningPayload(signedPayload);
    return nacl.sign.detached.verify(
      signingPayload,
      token.signature,
      new PublicKey(token.body.sub).toBytes(),
    );
  }

  isExpired(token: Token) {
    const nowUtcSeconds = new Date().getTime() / 1000;
    return nowUtcSeconds > token.body.exp;
  }

  private static getSigningPayload(signedPayload: string) {
    return Uint8Array.from(
      btoa(signedPayload)
        .split('')
        .map(function (c) {
          return c.charCodeAt(0);
        }),
    );
  }
}

// TODO: use base sdk error as a parent
export class TokenParsingError extends Error {}

export class TokenStructureValidationError extends Error {}