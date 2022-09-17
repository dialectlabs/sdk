import { Ed25519TokenSigner } from '../../../core/auth/ed25519/ed25519-token-signer';
import {
  PublicKey,
  TokenSignerResult,
} from '../../../core/auth/auth.interface';
import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { HexString } from 'aptos';

export class DialectWalletAdapterEd25519TokenSigner extends Ed25519TokenSigner {
  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const stringPayload = new TextDecoder().decode(payload);
    const signatureString = await this.dialectWalletAdapter.signMessage(
      stringPayload,
    );
    const hexString = HexString.ensure(signatureString);
    const signature = hexString.toUint8Array();
    return {
      payload,
      signature,
    };
  }

  // TODO: handle this better
  get subject(): PublicKey {
    const publicKey = this.dialectWalletAdapter.publicAccount.address;
    const hexString = HexString.ensure(publicKey!);
    return new AptosPubKey(hexString);
  }

  // TODO: handle this better
  get subjectPublicKey(): PublicKey {
    const publicKey = this.dialectWalletAdapter.publicAccount.publicKey;
    const hexString = HexString.ensure(publicKey!);
    return new AptosPubKey(hexString);
  }
}

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
