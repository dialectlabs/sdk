import {
  AuthenticationError,
  AuthorizationError,
  BusinessConstraintViolationError,
  DialectSdkError,
  ResourceAlreadyExistsError,
  ResourceNotFoundError,
  UnknownError,
} from '@sdk/errors';
import {
  DataServiceApiError,
  NetworkError,
} from '@data-service-api/data-service-api';

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

export async function withErrorParsing<T>(
  promise: Promise<T>,
  onResourceAlreadyExists: (e: DataServiceApiError) => DialectSdkError = (e) =>
    new ResourceAlreadyExistsError(e.message),
): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof NetworkError) {
      throw new DialectCloudUnreachableError([e]);
    }
    if (e instanceof DataServiceApiError) {
      if (e.statusCode === 401) {
        throw new AuthenticationError(e.message);
      }
      if (e.statusCode === 403) {
        throw new AuthorizationError(e.message);
      }
      if (e.statusCode === 404) {
        throw new ResourceNotFoundError();
      }
      if (e.statusCode === 409) {
        throw onResourceAlreadyExists(e);
      }
      if (e.statusCode === 412) {
        throw new BusinessConstraintViolationError(e.message);
      }
    }
    throw new UnknownError([e]);
  }
}
