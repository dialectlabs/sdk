import type { DialectEvmWalletAdapter } from './dialect-evm-wallet-adapter.interface';
import { Bytes, ethers } from 'ethers';

export class NodeDialectEvmWalletAdapter implements DialectEvmWalletAdapter {
  constructor(private readonly account: ethers.Wallet) {}

  get address() {
    return this.account.address;
  }

  static create(privateKey?: string) {
    const provider = new ethers.providers.JsonRpcProvider();
    if (privateKey) {
      const account = new ethers.Wallet(privateKey, provider);

      console.log(
        `Initializing ${NodeDialectEvmWalletAdapter.name} using provided ${account.address}.`,
      );
      return new NodeDialectEvmWalletAdapter(account);
    } else if (process.env.DIALECT_SDK_CREDENTIALS) {
      const privateKeyRaw = process.env.DIALECT_SDK_CREDENTIALS;
      const account = new ethers.Wallet(privateKeyRaw, provider);
      console.log(
        `Initializing ${NodeDialectEvmWalletAdapter.name} using provided ${account.address}.`,
      );
      return new NodeDialectEvmWalletAdapter(account);
    } else {
      throw new Error(
        `Error initializing ${NodeDialectEvmWalletAdapter.name}: SDK credential must be provided.`,
      );
    }
  }

  sign(data: string | Bytes | Uint8Array) {
    return this.account.signMessage(data);
  }
}
