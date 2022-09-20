import type { DialectAptosWalletAdapter } from './dialect-aptos-wallet-adapter.interface';
import type { AccountKeys } from '@manahippo/aptos-wallet-adapter/src/WalletAdapters/BaseAdapter';
import { AptosAccount } from 'aptos';

export class NodeDialectAptosWalletAdapter
  implements DialectAptosWalletAdapter
{
  constructor(private readonly account: AptosAccount) {}

  get publicAccount(): AccountKeys {
    return {
      publicKey: this.account.pubKey(),
      address: this.account.address(),
      authKey: this.account.authKey(),
    };
  }

  static create(privateKey?: Uint8Array) {
    if (privateKey) {
      const account = new AptosAccount(privateKey);
      console.log(
        `Initializing ${
          NodeDialectAptosWalletAdapter.name
        } using provided ${account.pubKey()} key and ${account.address()} address.`,
      );
      return new NodeDialectAptosWalletAdapter(account);
    }
    if (process.env.DIALECT_SDK_CREDENTIALS) {
      const privateKeyRaw = process.env.DIALECT_SDK_CREDENTIALS;
      const privateKey = new Uint8Array(JSON.parse(privateKeyRaw as string));
      const account = new AptosAccount(privateKey);
      console.log(
        `Initializing ${
          NodeDialectAptosWalletAdapter.name
        } using provided ${account.pubKey()} key and ${account.address()} address.`,
      );
      return new NodeDialectAptosWalletAdapter(account);
    }
    const account = new AptosAccount();
    console.log(
      `Initializing ${
        NodeDialectAptosWalletAdapter.name
      } using generated ${account.pubKey()} key and ${account.address()} address.`,
    );
    return new NodeDialectAptosWalletAdapter(account);
  }

  async signMessage(message: string): Promise<string> {
    return this.account
      .signBuffer(new TextEncoder().encode(message))
      .toString();
  }
}
