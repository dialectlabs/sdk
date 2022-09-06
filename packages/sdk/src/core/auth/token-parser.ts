import { decodeURLSafe } from '@stablelib/base64';
import type { Token, TokenBody, TokenHeader } from './auth.interface';
import { DialectSdkError } from '../sdk/errors';
import { jsonParseFromBase64 } from '../internal/utils/bytes-utils';

export class TokenParsingError extends DialectSdkError {
  constructor() {
    super(TokenParsingError.name, 'Unable to parse jwt token');
  }
}

export class TokenStructureValidationError extends DialectSdkError {
  constructor() {
    super(TokenStructureValidationError.name, 'Invalid jwt token');
  }
}

export class TokenUnsupportedAlgError extends DialectSdkError {
  constructor() {
    super(TokenUnsupportedAlgError.name, 'Jwt token alg unsupported');
  }
}

export abstract class TokenBodyParser {
  abstract parse(base64Body: string): TokenBody;
}

export class TokenParser {
  constructor(private readonly bodyParser: TokenBodyParser) {}

  parse(token: string): Token {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new TokenParsingError();
    }
    const [base64Header, base64Body, base64Signature] = parts;
    if (!base64Header || !base64Body || !base64Signature) {
      throw new TokenParsingError();
    }
    try {
      const header = this.parseHeader(base64Header);
      if (!header.alg) {
        throw new TokenUnsupportedAlgError();
      }
      const body = this.parseBody(base64Body);
      const signature = decodeURLSafe(base64Signature);
      return {
        base64Header,
        base64Body,
        base64Signature,
        rawValue: token,
        header,
        signature,
        body,
      };
    } catch (e) {
      console.error(e);
      throw new TokenParsingError();
    }
  }

  private parseHeader(base64Header: string): TokenHeader {
    return jsonParseFromBase64(base64Header);
  }

  private parseBody(base64Body: string): TokenBody {
    const body: TokenBody = this.bodyParser.parse(base64Body);
    if (!body.sub || !body.exp) {
      throw new TokenStructureValidationError();
    }
    return body;
  }
}
