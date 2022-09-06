import { TokenBodyParser } from '../token-parser';
import type { TokenBody } from '../auth.interface';
import { jsonParseFromBase64 } from '../../internal/utils/bytes-utils';

export class Ed25519TokenBodyParser extends TokenBodyParser {
  parse(base64Body: string): TokenBody {
    return jsonParseFromBase64(base64Body);
  }
}
