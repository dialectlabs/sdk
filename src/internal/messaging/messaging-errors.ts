import { DialectSdkError } from '@sdk/errors';

export abstract class MessagingError extends DialectSdkError {}

export class CannotDecryptError extends MessagingError {
  constructor() {
    super(
      CannotDecryptError.name,
      'Cannot decrypt messages',
      "This dialect's messages are encrypted and because you do not have access to the private key in this context.",
      // ['Authentication failed during decryption attempt'], // TODO: catch this in decorator
    );
  }
}

export class ThreadAlreadyExistsError extends MessagingError {
  constructor() {
    super(
      ThreadAlreadyExistsError.name,
      'Error',
      'You already have chat with this address',
    );
  }
}

export class ThreadNotFoundError extends MessagingError {
  constructor() {
    super(ThreadNotFoundError.name, 'Error', 'Thread not found');
  }
}
