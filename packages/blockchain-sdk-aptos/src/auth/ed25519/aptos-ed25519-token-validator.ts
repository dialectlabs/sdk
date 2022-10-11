import { sign } from 'tweetnacl';

import { APTOS_ED25519_TOKEN_SIGNER_ALG } from './aptos-ed25519-token-signer';
import { getAptosAccountAddress } from '../../utils/aptos-account-utils';
import {
  AuthenticationError,
  Token,
  TokenHeader,
  TokenValidator,
} from '@dialectlabs/sdk';
import { HexString } from 'aptos';
import { getPublicKeyWithPadding } from '../../utils/aptos-public-key-utils';

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

  override performExtraValidation(token: Token): boolean {
    const address = getAptosAccountAddress(
      HexString.fromUint8Array(this.getPublicKey(token)),
    ).toString();
    return BigInt(token.body.sub) === BigInt(address);
  }

  private getPublicKey(token: Token): Uint8Array {
    const signerPublicKey = token.body.sub_jwk;
    if (!signerPublicKey) {
      throw new AuthenticationError(
        'Cannot validate token without sub_jwk claim',
      );
    }
    const hexPubKey = HexString.ensure(signerPublicKey);
    return getPublicKeyWithPadding(hexPubKey).toUint8Array();
  }
}
