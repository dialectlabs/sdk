import { AptosAccount, HexString } from 'aptos';

export const dappPrivateKey: Uint8Array = HexString.ensure(
  '0x87648156e15aa011336ba8b05ad930ebdb28f5549fcb1047cc4cb356e0aaa557',
).toUint8Array();
export const dappAccountAddress: HexString = new AptosAccount(
  dappPrivateKey,
).address();
