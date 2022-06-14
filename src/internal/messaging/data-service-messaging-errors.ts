import { DialectSdkError } from '@sdk/errors';

export abstract class DataServiceError extends DialectSdkError {}

export class DialectCloudUnreachableError extends DataServiceError {
  constructor(details?: any[]) {
    super(
      DialectCloudUnreachableError.name,
      'Lost connection to Dialect Cloud',
      'Having problems reaching Dialect Cloud. Please try again later.',
      details,
    );
  }
}
