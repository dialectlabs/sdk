import { DIALECT_BLOCKCHAIN_SDK_TYPE_POLYGON } from '../src/sdk/constant';
import type { DialectPolygonWalletAdapterWrapper } from '../wallet-adapter/dialect-polygon-wallet-adapter-wrapper';
import type {
  AccountAddress,
  TokenSigner,
  TokenSignerResult,
} from '@dialectlabs/sdk';

export const EVM_ED25519_TOKEN_SIGNER_ALG = `${DIALECT_BLOCKCHAIN_SDK_TYPE_POLYGON}-ed25519`;

export abstract class PolygonEd25519TokenSigner implements TokenSigner {
  readonly alg = EVM_ED25519_TOKEN_SIGNER_ALG;
  abstract subject: AccountAddress;
  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterPolygonEd25519TokenSigner extends PolygonEd25519TokenSigner {
  constructor(
    readonly dialectWalletAdapter: DialectPolygonWalletAdapterWrapper,
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
