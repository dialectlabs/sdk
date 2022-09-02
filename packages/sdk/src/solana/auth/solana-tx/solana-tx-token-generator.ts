import type { Duration } from 'luxon';
import type { Token } from '../../../core/auth/auth.interface';
import {
  bytesToBase64,
  jsonStringifyToBase64,
} from '../../../internal/utils/bytes-utils';
import { TokenGenerator } from '../../../core/auth/token-generator';

export class SolanaTxTokenGenerator extends TokenGenerator {
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
