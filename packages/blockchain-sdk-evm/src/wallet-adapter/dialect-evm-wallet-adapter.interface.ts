import type {
  TransactionConfig,
  SignedTransaction,
  EncryptedKeystoreV3Json,
  Sign,
} from 'web3-core';

export interface DialectEvmWalletAdapter {
  address?: string;
  signTransaction: (
    transactionConfig: TransactionConfig,
    callback?: (signTransaction: SignedTransaction) => void,
  ) => Promise<SignedTransaction>;
  sign: (data: string) => Sign;
  encrypt: (password: string) => EncryptedKeystoreV3Json;
}
