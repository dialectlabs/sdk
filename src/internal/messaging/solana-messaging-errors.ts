import { DialectSdkError, UnknownError } from '@sdk/errors';
import type { AnchorError } from '@project-serum/anchor';

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

export class AccountNotFoundError extends SolanaError {
  static matchers = ['Account does not exist'];

  constructor(details?: any[]) {
    super(
      AccountNotFoundError.name,
      'Error',
      'Account does not exist',
      details,
    );
  }
}

export class AccountAlreadyExistsError extends SolanaError {
  static matchers = ['already in use'];

  constructor(details?: any[]) {
    super(
      AccountAlreadyExistsError.name,
      'Error',
      'Account already exists',
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

export async function withErrorParsing<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    const err = e as Error;
    throw parseError(err);
  }
}

function parseError(error: Error | AnchorError) {
  const message = error.message;
  const logs = (('logs' in error && error.logs) || []).join('');
  if (InsufficientFundsError.matchers.some((it) => message.match(it))) {
    throw new InsufficientFundsError([error]);
  }
  if (DisconnectedFromChainError.matchers.some((it) => message.match(it))) {
    throw new DisconnectedFromChainError([error]);
  }
  if (AccountAlreadyExistsError.matchers.some((it) => logs.match(it))) {
    throw new AccountAlreadyExistsError([error]);
  }
  if (AccountNotFoundError.matchers.some((it) => message.match(it))) {
    throw new AccountNotFoundError([error]);
  }
  if (NotSignedError.matchers.some((it) => message.match(it))) {
    throw new NotSignedError([error]);
  }
  throw new UnknownError([error]);
}
