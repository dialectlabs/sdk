import nacl from 'tweetnacl';
import type { Duration } from 'luxon';
import { PublicKey } from '@solana/web3.js';
import type {
  AuthTokens,
  Ed25519TokenSigner,
  Token,
  TokenBody,
  TokenHeader,
} from '@auth/auth.interface';
import { decodeURLSafe, encodeURLSafe } from '@stablelib/base64';

export class AuthTokensImpl implements AuthTokens {
  async generate(signer: Ed25519TokenSigner, ttl: Duration): Promise<Token> {
    const header: TokenHeader = {
      alg: 'ed25519',
      typ: 'JWT',
    };
    const base64Header = toBase64(header);
    const nowUtcSeconds = new Date().getTime() / 1000;
    const body: TokenBody = {
      sub: signer.subject.toBase58(),
      iat: Math.round(nowUtcSeconds),
      exp: Math.round(nowUtcSeconds + ttl.toMillis() / 1000),
    };
    const base64Body = toBase64(body);
    const { signature, base64Signature } = await sign(
      base64Header,
      base64Body,
      signer,
    );
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
      const body: TokenBody = fromBase64(base64Body);
      if (!body.sub || !body.exp) {
        throw new TokenStructureValidationError();
      }
      const header: TokenHeader = fromBase64(base64Header);
      const signature = decodeURLSafe(base64Signature);
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
      console.error(e);
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
    const signingPayload = new TextEncoder().encode(signedPayload);
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
}

async function sign(
  base64Header: string,
  base64Body: string,
  signer: Ed25519TokenSigner,
) {
  const signingPayload = new TextEncoder().encode(
    base64Header + '.' + base64Body,
  );
  const signature = await signer.sign(signingPayload);
  const base64Signature = bytesToBase64(signature);
  return { signature, base64Signature };
}

export function toBase64<T>(t: T): string {
  const json = JSON.stringify(t);
  const byteArray = new TextEncoder().encode(json);
  return bytesToBase64(byteArray);
}

function bytesToBase64(signature: Uint8Array) {
  return encodeURLSafe(signature).replace(/=/g, '');
}

export function fromBase64<T>(serialized: string): T {
  const byteArray = decodeURLSafe(serialized);
  const json = new TextDecoder().decode(byteArray);
  return JSON.parse(json) as T;
}

// TODO: use base sdk error as a parent
export class TokenParsingError extends Error {}

export class TokenStructureValidationError extends Error {}
