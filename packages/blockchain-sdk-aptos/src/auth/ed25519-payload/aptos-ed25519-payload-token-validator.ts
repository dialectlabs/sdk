import { sign } from 'tweetnacl';

import { APTOS_ED25519_PAYLOAD_TOKEN_SIGNER_ALG } from './aptos-ed25519-payload-token-signer';
import { getAptosAccountAddress } from '../../utils/aptos-account-utils';
import { getPublicKeyWithPadding } from '../../utils/aptos-public-key-utils';
import {
  AuthenticationError,
  Token,
  TokenHeader,
  TokenValidator,
} from '@dialectlabs/sdk';
import { HexString } from 'aptos';
import { decodeURLSafe } from '@stablelib/base64';

export class AptosEd25519PayloadTokenValidator extends TokenValidator {
  canValidate(tokenHeader: TokenHeader): boolean {
    return tokenHeader.alg === APTOS_ED25519_PAYLOAD_TOKEN_SIGNER_ALG;
  }

  override isSignatureValid(token: Token): boolean {
    const signedPayload = decodeURLSafe(token.base64Body);
    return sign.detached.verify(
      signedPayload,
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
