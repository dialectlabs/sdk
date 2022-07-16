import { Transaction } from '@solana/web3.js';
import { decodeURLSafe } from '@stablelib/base64';
import type {
  Token,
  TokenBody,
  TokenHeader,
  TokenHeaderAlg,
} from '../../auth/auth.interface';
import { DialectSdkError } from '../../sdk/errors';
import { bytesFromBase64, jsonParseFromBase64 } from '../utils/bytes-utils';

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

const bodyParsers: Record<TokenHeaderAlg, (base64Body: string) => TokenBody> = {
  ed25519: (base64Body) => {
    return jsonParseFromBase64(base64Body);
  },
  'solana-tx': (base64Body) => {
    const byteBody = bytesFromBase64(base64Body);
    const tx = Transaction.from(byteBody);
    const dataInstruction = tx.instructions[0];
    if (!dataInstruction) {
      throw new TokenStructureValidationError();
    }
    const [headerBase64, bodyBase64] = dataInstruction.data
      .toString()
      .split('.');

    if (!headerBase64 || !bodyBase64) {
      throw new TokenStructureValidationError();
    }

    return jsonParseFromBase64(bodyBase64);
  },
};

export class TokenParser {
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
      const header = this.parseHeader(base64Header);
      if (!header.alg) {
        throw new TokenUnsupportedAlgError();
      }
      const body = this.parseBody(header.alg, base64Body);
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

  private static parseHeader(base64Header: string): TokenHeader {
    return jsonParseFromBase64(base64Header);
  }

  private static parseBody(alg: TokenHeaderAlg, base64Body: string): TokenBody {
    const parser = bodyParsers[alg];
    if (!parser) {
      throw new TokenUnsupportedAlgError();
    }
    const body: TokenBody = parser(base64Body);
    if (!body.sub || !body.exp) {
      throw new TokenStructureValidationError();
    }
    return body;
  }
}
