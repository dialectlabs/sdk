import { decodeURLSafe, encodeURLSafe } from '@stablelib/base64';

export function bytesToBase64(bytes: Uint8Array): string {
  return encodeURLSafe(bytes).replace(/=/g, '');
}

export function bytesFromBase64(base64: string): Uint8Array {
  return decodeURLSafe(base64);
}

export function jsonStringifyToBase64<T>(t: T): string {
  const json = JSON.stringify(t);
  const byteArray = new TextEncoder().encode(json);
  return bytesToBase64(byteArray);
}

export function jsonParseFromBase64<T>(serialized: string): T {
  const byteArray = decodeURLSafe(serialized);
  const json = new TextDecoder().decode(byteArray);
  return JSON.parse(json) as T;
}
