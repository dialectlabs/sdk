import { bytesToBase64 } from '../utils/bytes-utils';
import type {
  Token,
  TokenBody,
  TokenHeader,
  TokenSigner,
} from './auth.interface';

export abstract class TokenGenerator {
  constructor(protected readonly signer: TokenSigner) {}

  abstract generate(ttlSeconds: number): Promise<Token>;

  protected header(): TokenHeader {
    return {
      alg: this.signer.alg,
      typ: 'JWT',
    };
  }

  protected body(ttlSeconds: number): TokenBody {
    const nowUtcSeconds = new Date().getTime() / 1000;
    const body: TokenBody = {
      sub: this.signer.subject,
      sub_jwk: this.signer.subjectPublicKey?.toString(),
      iat: Math.round(nowUtcSeconds),
      exp: Math.round(nowUtcSeconds + ttlSeconds),
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
    return { signedPayload, signature, base64Signature };
  }
}
