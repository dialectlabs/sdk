import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import type { Duration } from 'luxon';
import { PublicKey } from '@solana/web3.js';

export interface Token {
  rawValue: string;
  header: TokenHeader;
  body: TokenBody;
  signature: Uint8Array;
  base64Header: string;
  base64Body: string;
  base64Signature: string;
}

export interface TokenHeader {
  alg?: string;
  typ?: string;
}

export interface TokenBody {
  sub: string;
  iat?: number;
  exp: number;
}

export interface TokenSigner {
  publicKey: PublicKey;

  signMessage(message: Uint8Array): Promise<Uint8Array>;
}

export class Token {
  static async generate(signer: TokenSigner, ttl: Duration): Promise<Token> {
    const header: TokenHeader = {
      alg: 'ed25519',
      typ: 'JWT',
    };
    const base64Header = btoa(JSON.stringify(header));
    const nowUtcSeconds = new Date().getTime() / 1000;
    const body: TokenBody = {
      sub: signer.publicKey.toBase58(),
      iat: Math.round(nowUtcSeconds),
      exp: Math.round(nowUtcSeconds + ttl.toMillis() / 1000),
    };
    const base64Body = btoa(JSON.stringify(body));
    const signingPayload = this.getSigningPayload(
      base64Header + '.' + base64Body,
    );
    const signature = await signer.signMessage(signingPayload);
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

  static parse(rawToken: string): Token {
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

  static isValid(token: Token) {
    if (!Token.isSignatureValid(token)) {
      return false;
    }
    return !Token.isExpired(token);
  }

  static isSignatureValid(token: Token) {
    const signedPayload = token.base64Header + '.' + token.base64Body;
    const signingPayload = this.getSigningPayload(signedPayload);
    const signatureValid = nacl.sign.detached.verify(
      signingPayload,
      token.signature,
      new PublicKey(token.body.sub).toBytes(),
    );
    return signatureValid;
  }

  static isExpired(token: Token) {
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

export class TokenParsingError extends Error {}

export class TokenStructureValidationError extends Error {}
