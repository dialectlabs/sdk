import { Token, TokenHeader, TokenValidator } from '@dialectlabs/sdk';
import Web3 from 'web3';
import { EVM_ED25519_TOKEN_SIGNER_ALG } from './polygon-ed25519-token-signer';

export class PolygonEd25519TokenValidator extends TokenValidator {
  isSignatureValid(token: Token): boolean {
    const messageBase64 = token.base64Header + '.' + token.base64Body;
    const message = `0x${Buffer.from(messageBase64, 'utf-8').toString('hex')}`;

    const web3 = new Web3()
    const signature = Buffer.from(token.signature).toString();
    const recoveredAddr = web3.eth.accounts.recover(message, signature);
    return recoveredAddr === token.body.sub;
  }

  canValidate(tokenHeader: TokenHeader): boolean {
    return tokenHeader.alg === EVM_ED25519_TOKEN_SIGNER_ALG;
  }
}
