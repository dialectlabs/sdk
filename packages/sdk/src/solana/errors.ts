import { DialectSdkError } from '../core/sdk/errors';

export abstract class SolanaError extends DialectSdkError {}

export class InsufficientFundsError extends SolanaError {
  static matchers = [
    'Attempt to debit an account but found no record of a prior credit.',
    /(0x1)$/gm,
  ];

  constructor(details?: any[]) {
    super(
      InsufficientFundsError.name,
      'Insufficient Funds',
      'You do not have enough funds to complete this transaction. Please deposit more funds and try again.',
      details,
    );
  }
}

export class DisconnectedFromChainError extends SolanaError {
  static matchers = ['Network request failed'];

  constructor(details?: any[]) {
    super(
      DisconnectedFromChainError.name,
      'Lost connection to Solana blockchain',
      'Having problems reaching Solana blockchain. Please try again later.',
      details,
    );
  }
}

export class NotSignedError extends SolanaError {
  static matchers = ['User rejected the request'];

  constructor(details?: any[]) {
    super(
      NotSignedError.name,
      'Error',
      'You must sign the message to complete this action',
      details,
    );
  }
}
