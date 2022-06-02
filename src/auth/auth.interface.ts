import type { PublicKey } from '@solana/web3.js';
import type { Duration } from 'luxon';
import { AuthTokensImpl } from '@auth/internal/token-utils';
import { UnsupportedOperationError } from '@sdk/errors';
import type { DialectWalletAdapter } from '@wallet-adapter/dialect-wallet-adapter.interface';

export class Auth {
  private constructor() {}

  static tokens = new AuthTokensImpl();
}

export abstract class AuthTokens {
  abstract generate(signer: Ed25519TokenSigner, ttl: Duration): Promise<Token>;

  abstract parse(rawToken: string): Token;

  abstract isValid(token: Token): boolean;

  abstract isSignatureValid(token: Token): boolean;

  abstract isExpired(token: Token): boolean;
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
  alg?: string;
  typ?: string;
}

export interface TokenBody {
  sub: string;
  iat?: number;
  exp: number;
}

export interface Ed25519TokenSigner {
  subject: PublicKey;

  sign(payload: Uint8Array): Promise<Uint8Array>;
}

export class DialectWalletAdapterEd25519TokenSigner
  implements Ed25519TokenSigner
{
  readonly subject: PublicKey;

  constructor(readonly dialectWalletAdapter: DialectWalletAdapter) {
    this.subject = dialectWalletAdapter.publicKey;
  }

  sign(payload: Uint8Array): Promise<Uint8Array> {
    if (!this.dialectWalletAdapter.signMessage) {
      throw new UnsupportedOperationError(
        'Wallet operation not supported',
        'Wallet does not support signing, please use wallet-adapter that has supports signMessage() operation.',
      );
    }
    return this.dialectWalletAdapter.signMessage(payload);
  }
}
