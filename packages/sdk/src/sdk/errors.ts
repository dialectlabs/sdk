export class DialectSdkError extends Error {
  constructor(
    readonly type: string,
    readonly title: string,
    readonly msg?: string,
    readonly details?: any[],
  ) {
    super(msg);
    this.msg = msg;
    this.type = type;
    this.title = title;
    this.details = details;
  }
}

export class IllegalArgumentError extends DialectSdkError {
  constructor(title: string, msg?: string, details?: any) {
    super(IllegalArgumentError.name, title, msg, details);
  }
}

export class IllegalStateError extends DialectSdkError {
  constructor(title: string, msg?: string, details?: any) {
    super(IllegalStateError.name, title, msg, details);
  }
}

export class UnsupportedOperationError extends DialectSdkError {
  constructor(title: string, msg?: string, details?: any) {
    super(UnsupportedOperationError.name, title, msg, details);
  }
}

export class UnknownError extends DialectSdkError {
  constructor(details?: any, msg?: string) {
    super(
      UnknownError.name,
      'Error',
      msg ?? 'Something went wrong. Please try again later.',
      details,
    );
  }
}

export class BusinessConstraintViolationError extends DialectSdkError {
  constructor(msg?: string) {
    super(BusinessConstraintViolationError.name, 'Error', msg);
  }
}

export class ResourceAlreadyExistsError extends DialectSdkError {
  constructor(msg?: string) {
    super(ResourceAlreadyExistsError.name, 'Error', msg);
  }
}

export class AuthenticationError extends DialectSdkError {
  constructor(msg?: string) {
    super(AuthenticationError.name, 'Error', msg);
  }
}

export class AuthorizationError extends DialectSdkError {
  constructor(msg?: string) {
    super(AuthorizationError.name, 'Error', msg);
  }
}

export class ResourceNotFoundError extends DialectSdkError {
  constructor(msg?: string) {
    super(ResourceNotFoundError.name, 'Error', msg);
  }
}

export abstract class DialectCloudError extends DialectSdkError {}

export class DialectCloudUnreachableError extends DialectCloudError {
  constructor(details?: any[]) {
    super(
      DialectCloudUnreachableError.name,
      'Lost connection to Dialect Cloud',
      'Having problems reaching Dialect Cloud. Please try again later.',
      details,
    );
  }
}

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

export abstract class MessagingError extends DialectSdkError {}

export class ThreadAlreadyExistsError extends MessagingError {
  constructor() {
    super(
      ThreadAlreadyExistsError.name,
      'Error',
      'You already have chat with this address',
    );
  }
}
