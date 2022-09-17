import { Ed25519TokenValidator } from '../../../core/auth/ed25519/ed25519-token-validator';
import type { Token } from '../../../core/auth/auth.interface';
import { AptosAccount, HexString } from 'aptos';
import { getAptosAccountAddress } from '../../utils/aptos-account-utilts';

export class AptosEd25519TokenValidator extends Ed25519TokenValidator {
  override isValid(token: Token): boolean {
    const isValid = super.isValid(token);
    const accountAddress = getAptosAccountAddress(
      HexString.fromUint8Array(this.publicKey(token)),
    ).toString();
    return isValid && token.body.sub === accountAddress;
  }

  protected override publicKey(token: Token): Uint8Array {
    const signerPublicKey = token.body.sub_jwk;
    if (!signerPublicKey) {
      return new AptosAccount().pubKey().toUint8Array();
    }
    return HexString.ensure(signerPublicKey).toUint8Array();
  }
}
