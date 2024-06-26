import type { Token } from './auth.interface';
import { jsonStringifyToBase64 } from '../utils/bytes-utils';
import { TokenGenerator } from './token-generator';

export class DefaultTokenGenerator extends TokenGenerator {
  override async generate(ttlSeconds: number): Promise<Token> {
    const header = this.header();
    const base64Header = jsonStringifyToBase64(header);

    const body = this.body(ttlSeconds);
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
