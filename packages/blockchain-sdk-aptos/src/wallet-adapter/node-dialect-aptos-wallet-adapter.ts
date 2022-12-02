import type {
  Address,
  DialectAptosWalletAdapter,
  PublicKey,
  SignMessagePayload,
  SignMessageResponse,
} from './dialect-aptos-wallet-adapter.interface';
import { AptosAccount } from 'aptos';

export class NodeDialectAptosWalletAdapter
  implements DialectAptosWalletAdapter
{
  constructor(private readonly account: AptosAccount) {}

  get address(): Address {
    return this.account.address().toString();
  }

  get publicKey(): PublicKey {
    return this.account.pubKey().toString();
  }

  static create(privateKey?: Uint8Array) {
    if (privateKey) {
      const account = new AptosAccount(privateKey);
      console.log(
        `Initializing ${
          NodeDialectAptosWalletAdapter.name
        } using provided ${account.pubKey()} public key and ${account.address()} address.`,
      );
      return new NodeDialectAptosWalletAdapter(account);
    } else if (process.env.DIALECT_SDK_CREDENTIALS) {
      const privateKeyRaw = process.env.DIALECT_SDK_CREDENTIALS;
      const privateKey = new Uint8Array(JSON.parse(privateKeyRaw as string));
      const account = new AptosAccount(privateKey);
      console.log(
        `Initializing ${
          NodeDialectAptosWalletAdapter.name
        } using provided ${account.pubKey()} public key and ${account.address()} address.`,
      );
      return new NodeDialectAptosWalletAdapter(account);
    } else {
      throw new Error(
        `Error initializing ${NodeDialectAptosWalletAdapter.name}: SDK credential must be provided.`,
      );
    }
  }

  async signMessage(message: string): Promise<string> {
    return this.account
      .signBuffer(new TextEncoder().encode(message))
      .toString();
  }

  async signMessagePayload(
    payload: SignMessagePayload,
  ): Promise<SignMessageResponse> {
    const prefix = `APTOS`;
    const fullMessage = `${prefix}\nmessage: ${payload.message}\nnonce: ${payload.nonce}`;
    const signature = this.account
      .signBuffer(new TextEncoder().encode(fullMessage))
      .toString();
    return {
      prefix,
      message: payload.message,
      nonce: payload.nonce,
      fullMessage,
      signature,
    };
  }
}
