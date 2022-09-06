import { PublicKey } from '../auth.interface';
import bs58 from 'bs58';

export type Ed25519PublicKeyInitData = string | Uint8Array;

export class Ed25519PublicKey extends PublicKey {
  private readonly value: Uint8Array;

  constructor(value: Ed25519PublicKeyInitData) {
    super();
    if (typeof value === 'string') {
      this.value = bs58.decode(value);
    } else {
      this.value = value;
    }
  }

  toBytes(): Uint8Array {
    return this.value;
  }

  toString(): string {
    return bs58.encode(this.value);
  }
}
