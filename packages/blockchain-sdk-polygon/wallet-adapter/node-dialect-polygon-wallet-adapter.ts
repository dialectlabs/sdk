import type { Account, TransactionConfig, SignedTransaction } from 'web3-core';
import Web3 from 'web3';
import type { DialectPolygonWalletAdapter } from './dialect-polygon-wallet-adapter.interface';

export class NodeDialectPolygonWalletAdapter
  implements DialectPolygonWalletAdapter
{
  constructor(private readonly account: Account) {}

  get address() {
    return this.account.address;
  }

  static create(privateKey?: string) {
    const web3 = new Web3();
    if (privateKey) {
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      console.log(
        `Initializing ${NodeDialectPolygonWalletAdapter.name} using provided ${account.address}.`,
      );
      return new NodeDialectPolygonWalletAdapter(account);
    } else if (process.env.DIALECT_SDK_CREDENTIALS) {
      const privateKeyRaw = process.env.DIALECT_SDK_CREDENTIALS;
      const account = web3.eth.accounts.privateKeyToAccount(privateKeyRaw);
      console.log(
        `Initializing ${NodeDialectPolygonWalletAdapter.name} using provided ${account.address}.`,
      );
      return new NodeDialectPolygonWalletAdapter(account);
    } else {
      throw new Error(
        `Error initializing ${NodeDialectPolygonWalletAdapter.name}: SDK credential must be provided.`,
      );
    }
  }

  encrypt(password: string) {
    return this.account.encrypt(password);
  }

  sign(data: string) {
    return this.account.sign(data);
  }

  signTransaction(
    transactionConfig: TransactionConfig,
    callback?: (signTransaction: SignedTransaction) => void,
  ): Promise<SignedTransaction> {
    return this.account.signTransaction(transactionConfig, callback);
  }
}
