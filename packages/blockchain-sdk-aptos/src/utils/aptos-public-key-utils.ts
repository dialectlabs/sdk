import { HexString } from 'aptos';

export function getPublicKeyWithPadding(pubKey: HexString): HexString {
  const pubKeyRequiredSize = 64;
  let pubKeyStr = pubKey.noPrefix();
  if (pubKeyStr.length === pubKeyRequiredSize) {
    return pubKey;
  }
  pubKeyStr = pubKey.toShortString().slice(2).padStart(pubKeyRequiredSize, '0');
  return HexString.ensure(pubKeyStr);
}
