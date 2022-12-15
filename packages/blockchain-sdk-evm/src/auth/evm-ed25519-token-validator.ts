import { Token, TokenHeader, TokenValidator } from '@dialectlabs/sdk';
import { ethers } from 'ethers';
import { EVM_ED25519_TOKEN_SIGNER_ALG } from './evm-ed25519-token-signer';

export class EvmEd25519TokenValidator extends TokenValidator {
  isSignatureValid(token: Token): boolean {
    const messageBase64 = token.base64Header + '.' + token.base64Body;
    const messageHash = ethers.utils.solidityKeccak256(
      ['string'],
      [messageBase64],
    );

    const signature = ethers.utils.hexlify(token.signature);

    const recoveredAddress = ethers.utils.verifyMessage(messageHash, signature);

    return recoveredAddress === token.body.sub;
  }

  canValidate(tokenHeader: TokenHeader): boolean {
    return tokenHeader.alg === EVM_ED25519_TOKEN_SIGNER_ALG;
  }
}
