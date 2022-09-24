import { PublicKey } from '@dialectlabs/sdk';
import type { HexString } from 'aptos';

export class AptosPubKey extends PublicKey {
  constructor(readonly hexString: HexString) {
    super();
  }

  toString(): string {
    return this.hexString.toString();
  }

  toBytes(): Uint8Array {
    return this.hexString.toUint8Array();
  }
}
