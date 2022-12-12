import type {
  AccountAddress,
  TokenSigner,
  TokenSignerResult,
} from '@dialectlabs/sdk';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_EVM } from '../sdk/constants';
import type { DialectEvmWalletAdapterWrapper } from '../wallet-adapter/dialect-evm-wallet-adapter-wrapper';

export const EVM_ED25519_TOKEN_SIGNER_ALG = `${DIALECT_BLOCKCHAIN_SDK_TYPE_EVM}-ed25519`;

export abstract class EvmEd25519TokenSigner implements TokenSigner {
  readonly alg = EVM_ED25519_TOKEN_SIGNER_ALG;
  abstract subject: AccountAddress;
  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterEvmEd25519TokenSigner extends EvmEd25519TokenSigner {
  constructor(
    readonly dialectWalletAdapter: DialectEvmWalletAdapterWrapper,
  ) {
    super();
  }

  get subject(): AccountAddress {
    return this.dialectWalletAdapter.address;
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    const stringPayload = new TextDecoder().decode(payload);
    const message = `0x${Buffer.from(stringPayload, 'utf-8').toString('hex')}`;
    const sign = await this.dialectWalletAdapter.sign(message);

    const bufferPayload = Buffer.from(sign.message);
    const bufferSignature = Buffer.from(sign.signature);

    return {
      payload: bufferPayload,
      signature: bufferSignature,
    };
  }
}
