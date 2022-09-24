import type { TokenBody } from '@dialectlabs/sdk';
import {
  bytesFromBase64,
  jsonParseFromBase64,
  TokenBodyParser,
  TokenStructureValidationError,
} from '@dialectlabs/sdk';

export class AptosEd25519PayloadTokenBodyParser extends TokenBodyParser {
  parse(base64Body: string): TokenBody {
    const byteBody = bytesFromBase64(base64Body);
    const decoded = new TextDecoder().decode(byteBody);
    const signedPayload = decoded
      .split('\n')
      .find((it) => it.startsWith('message'))
      ?.split(':')[1]
      ?.trim();
    if (!signedPayload) {
      throw new TokenStructureValidationError();
    }
    const [headerBase64, bodyBase64] = signedPayload.split('.');
    if (!headerBase64 || !bodyBase64) {
      throw new TokenStructureValidationError();
    }
    return jsonParseFromBase64<TokenBody>(bodyBase64);
  }
}
