import type { TokenBody } from '@dialectlabs/sdk';
import {
  bytesFromBase64,
  jsonParseFromBase64,
  TokenBodyParser,
  TokenStructureValidationError,
} from '@dialectlabs/sdk';
import { Transaction } from '@solana/web3.js';

export class SolanaTxTokenBodyParser extends TokenBodyParser {
  parse(base64Body: string): TokenBody {
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
  }
}
