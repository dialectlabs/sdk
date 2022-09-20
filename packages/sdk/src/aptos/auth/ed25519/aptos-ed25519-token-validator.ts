import type { Token, TokenHeader } from '../../../core/auth/auth.interface';
import { HexString } from 'aptos';
import { getAptosAccountAddress } from '../../utils/aptos-account-utils';
import { sign } from 'tweetnacl';
import { TokenValidator } from '../../../core/auth/token-validator';
import { AuthenticationError } from '../../../core/sdk/errors';
import { APTOS_ED25519_TOKEN_SIGNER_ALG } from './aptos-ed25519-token-signer';

export class AptosEd25519TokenValidator extends TokenValidator {
  canValidate(tokenHeader: TokenHeader): boolean {
    return tokenHeader.alg === APTOS_ED25519_TOKEN_SIGNER_ALG;
  }

  override isSignatureValid(token: Token): boolean {
    const signedPayload = token.base64Header + '.' + token.base64Body;
    const signingPayload = new TextEncoder().encode(signedPayload);
    return sign.detached.verify(
      signingPayload,
      token.signature,
      this.getPublicKey(token),
    );
  }

  override validateCustom(token: Token): boolean {
    const address = getAptosAccountAddress(
      HexString.fromUint8Array(this.getPublicKey(token)),
    ).toString();
    return token.body.sub === address;
  }

  private getPublicKey(token: Token): Uint8Array {
    const signerPublicKey = token.body.sub_jwk;
    if (!signerPublicKey) {
      throw new AuthenticationError(
        'Cannot validate token without sub_jwk claim',
      );
    }
    return HexString.ensure(signerPublicKey).toUint8Array();
  }
}
