import type { AccountAddress } from '@dialectlabs/sdk';
import type {
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '@dialectlabs/sdk';

import type { DialectAptosWalletAdapterWrapper } from '../../wallet-adapter/dialect-aptos-wallet-adapter-wrapper';
import { HexString } from 'aptos';
import { AptosPubKey } from '../aptos-public-key';

export const APTOS_ED25519_PAYLOAD_TOKEN_SIGNER_ALG = 'aptos-ed25519-payload';

export abstract class AptosEd25519PayloadTokenSigner implements TokenSigner {
  readonly alg = APTOS_ED25519_PAYLOAD_TOKEN_SIGNER_ALG;

  abstract subject: AccountAddress;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterAptosEd25519PayloadTokenSigner extends AptosEd25519PayloadTokenSigner {
  constructor(readonly dialectWalletAdapter: DialectAptosWalletAdapterWrapper) {
    super();
  }

  get subject(): AccountAddress {
    const address = this.dialectWalletAdapter.address;
    const hexString = HexString.ensure(address.toString());
    return hexString.toString();
  }

  get subjectPublicKey(): PublicKey {
    const publicKey = this.dialectWalletAdapter.publicKey;
    const hexString = HexString.ensure(publicKey.toString());
    return new AptosPubKey(hexString);
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const message = new TextDecoder().decode(payload);
    const { fullMessage, signature: rawSignature } =
      await this.dialectWalletAdapter.signMessagePayload({
        message,
        nonce: 'encoded_in_message',
      });
    const hexSignature = HexString.ensure(rawSignature);
    const signature = hexSignature.toUint8Array();
    return {
      payload: new TextEncoder().encode(fullMessage),
      signature,
    };
  }
}
