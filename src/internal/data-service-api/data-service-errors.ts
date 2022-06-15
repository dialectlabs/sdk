import {
  AuthenticationError,
  AuthorizationError,
  BusinessConstraintViolationError,
  DialectCloudUnreachableError,
  DialectSdkError,
  IllegalArgumentError,
  ResourceAlreadyExistsError,
  ResourceNotFoundError,
  UnknownError,
} from '@sdk/errors';
import {
  DataServiceApiError,
  NetworkError,
} from '@data-service-api/data-service-api';

export async function withErrorParsing<T>(
  promise: Promise<T>,
  onResourceAlreadyExists: (e: DataServiceApiError) => DialectSdkError = (e) =>
    new ResourceAlreadyExistsError(createMessage(e)),
): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof NetworkError) {
      throw new DialectCloudUnreachableError([e]);
    }
    if (e instanceof DataServiceApiError) {
      if (e.statusCode === 400) {
        throw new IllegalArgumentError(createMessage(e));
      }
      if (e.statusCode === 401) {
        throw new AuthenticationError(createMessage(e));
      }
      if (e.statusCode === 403) {
        throw new AuthorizationError(createMessage(e));
      }
      if (e.statusCode === 404) {
        throw new ResourceNotFoundError(createMessage(e));
      }
      if (e.statusCode === 409) {
        throw onResourceAlreadyExists(e);
      }
      if (e.statusCode === 412) {
        throw new BusinessConstraintViolationError(createMessage(e));
      }
      throw new UnknownError([e], createMessage(e));
    }
    throw new UnknownError([e]);
  }
}

function createMessage(e: DataServiceApiError) {
  return `${e.message}. ${e.requestId ? `Request ID: ${e.requestId}` : ''}`;
}
