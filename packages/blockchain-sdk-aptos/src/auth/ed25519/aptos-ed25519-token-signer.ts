import type {
  AccountAddress,
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '@dialectlabs/sdk';

import type { DialectAptosWalletAdapterWrapper } from '../../wallet-adapter/dialect-aptos-wallet-adapter-wrapper';
import { HexString } from 'aptos';
import { AptosPubKey } from '../aptos-public-key';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_APTOS } from '../../sdk/constants';

export const APTOS_ED25519_TOKEN_SIGNER_ALG = `${DIALECT_BLOCKCHAIN_SDK_TYPE_APTOS}-ed25519`;

export abstract class AptosEd25519TokenSigner implements TokenSigner {
  readonly alg = APTOS_ED25519_TOKEN_SIGNER_ALG;

  abstract subject: AccountAddress;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterAptosEd25519TokenSigner extends AptosEd25519TokenSigner {
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
