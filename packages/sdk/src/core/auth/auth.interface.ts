export type AccountAddress = string;

export abstract class PublicKey {
  abstract toString(): string;

  abstract toBytes(): Uint8Array;

  equals(other: PublicKey) {
    return this.toString() === other.toString();
  }
}

export interface Token {
  rawValue: string;
  header: TokenHeader;
  body: TokenBody;
  signature: Uint8Array;
  base64Header: string;
  base64Body: string;
  base64Signature: string;
}

export interface TokenHeader {
  alg: string;
  typ?: string;
}

export interface TokenBody {
  sub: string;
  sub_jwk?: string;
  iat?: number;
  exp: number;
}

export interface TokenSignerResult {
  payload: Uint8Array;
  signature: Uint8Array;
}

export abstract class TokenSigner {
  abstract alg: string;
  abstract subject: AccountAddress;
  abstract subjectPublicKey?: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}
