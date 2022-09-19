import {
  AccountAddress,
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '../../../core/auth/auth.interface';
import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { HexString } from 'aptos';

export const APTOS_ED25519_TOKEN_SIGNER_ALG = 'aptos-ed25519';

export abstract class AptosEd25519TokenSigner implements TokenSigner {
  readonly alg = APTOS_ED25519_TOKEN_SIGNER_ALG;

  abstract subject: AccountAddress;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterAptosEd25519TokenSigner extends AptosEd25519TokenSigner {
  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
  }

  get subject(): AccountAddress {
    const publicKey = this.dialectWalletAdapter.publicAccount.address;
    const hexString = HexString.ensure(publicKey!);
    return hexString.toString();
  }

  // TODO: handle this better
  get subjectPublicKey(): PublicKey {
    const publicKey = this.dialectWalletAdapter.publicAccount.publicKey;
    const hexString = HexString.ensure(publicKey!);
    return new AptosPubKey(hexString);
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
