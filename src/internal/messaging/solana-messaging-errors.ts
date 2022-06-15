import {
  DisconnectedFromChainError,
  InsufficientFundsError,
  NotSignedError,
  SolanaError,
  UnknownError,
} from '@sdk/errors';
import type { AnchorError } from '@project-serum/anchor';

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
  if (!InsufficientFundsError.matchers.some((it) => message.match(it))) {
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
  } else {
    throw new InsufficientFundsError([error]);
  }
}
