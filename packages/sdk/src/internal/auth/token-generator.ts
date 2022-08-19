import type {
  Token,
  TokenBody,
  TokenHeader,
  TokenSigner,
} from '@auth/auth.interface';
import type { Duration } from 'luxon';
import { bytesToBase64, jsonStringifyToBase64 } from '../utils/bytes-utils';
import { TokenUnsupportedAlgError } from './token-parser';

export abstract class TokenGenerator {
  constructor(protected readonly signer: TokenSigner) { }

  static new(signer: TokenSigner): TokenGenerator {
    if (signer.alg === 'ed25519') {
      return new Ed25519TokenGenerator(signer);
    }
    if (signer.alg === 'solana-tx') {
      return new SolanaTxTokenGenerator(signer);
    }

    throw new TokenUnsupportedAlgError();
  }

  abstract generate(ttl: Duration): Promise<Token>;

  protected header(): TokenHeader {
    return {
      alg: this.signer.alg,
      typ: 'JWT',
    };
  }

  protected body(ttl: Duration): TokenBody {
    const nowUtcSeconds = new Date().getTime() / 1000;
    const body: TokenBody = {
      sub: this.signer.subject.toBase58(),
      iat: Math.round(nowUtcSeconds),
      exp: Math.round(nowUtcSeconds + ttl.toMillis() / 1000),
    };
    return body;
  }

  protected async sign(
    base64Header: string,
    base64Body: string,
    signer: TokenSigner,
  ) {
    const signingPayload = new TextEncoder().encode(
      base64Header + '.' + base64Body,
    );
    const { payload: signedPayload, signature } = await signer.sign(
      signingPayload,
    );
    const base64Signature = bytesToBase64(signature);
    return { signedBody: signedPayload, signature, base64Signature };
  }
}

class Ed25519TokenGenerator extends TokenGenerator {
  override async generate(ttl: Duration): Promise<Token> {
    const header = this.header();
    const base64Header = jsonStringifyToBase64(header);

    const body = this.body(ttl);
    const base64Body = jsonStringifyToBase64(body);

    const { signature, base64Signature } = await this.sign(
      base64Header,
      base64Body,
      this.signer,
    );

    const rawValue = `${base64Header}.${base64Body}.${base64Signature}`;
    return {
      rawValue,
      body,
      header,
      signature,
      base64Signature,
      base64Body,
      base64Header,
    };
  }
}

class SolanaTxTokenGenerator extends TokenGenerator {
  override async generate(ttl: Duration): Promise<Token> {
    const header = this.header();
    const base64Header = jsonStringifyToBase64(header);

    const body = this.body(ttl);
    const base64Body = jsonStringifyToBase64(body);

    const { signature, base64Signature, signedBody } = await this.sign(
      base64Header,
      base64Body,
      this.signer,
    );

    const base64SignedBody = bytesToBase64(signedBody);

    const rawValue = `${base64Header}.${base64SignedBody}.${base64Signature}`;
    return {
      rawValue,
      body,
      header,
      signature,
      base64Signature,
      base64Body: base64SignedBody,
      base64Header,
    };
  }
}
