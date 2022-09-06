import { DialectSdkError } from '../sdk/errors';

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
