import { DialectSdkError } from '../sdk/errors';

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
