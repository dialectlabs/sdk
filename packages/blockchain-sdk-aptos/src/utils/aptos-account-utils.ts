import { sha3_256 } from 'js-sha3';
import { Buffer } from 'buffer/';
import type { MaybeHexString } from 'aptos';
import { HexString } from 'aptos';

export function getAptosAccountAddress(publicKey: MaybeHexString) {
  const hash = sha3_256.create();
  hash.update(Buffer.from(HexString.ensure(publicKey).toUint8Array()));
  hash.update('\x00');
  const authKey = new HexString(hash.hex());
  return HexString.ensure(authKey.hex());
}
