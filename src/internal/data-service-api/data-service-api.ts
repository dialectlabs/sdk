import type { TokenProvider } from '@auth/internal/token-provider';
import type { AxiosError } from 'axios';
import type { DataServiceDialectsApi } from '@data-service-api/data-service-dialects-api';
import { DataServiceDialectsApiClient } from '@data-service-api/data-service-dialects-api';
import { DataServiceDappsApiClient } from '@data-service-api/data-service-dapps-api';

export class DataServiceApi {
  private constructor(
    readonly threads: DataServiceDialectsApi,
    readonly dapps: DataServiceDappsApiClient,
  ) {}

  static create(baseUrl: string, tokenProvider: TokenProvider) {
    const dialectsApi = new DataServiceDialectsApiClient(
      baseUrl,
      tokenProvider,
    );
    const dappAddressesApi = new DataServiceDappsApiClient(
      baseUrl,
      tokenProvider,
    );
    return new DataServiceApi(dialectsApi, dappAddressesApi);
  }
}

interface RawDataServiceApiError {
  message: string;
}

export type DataServiceApiClientError = NetworkError | DataServiceApiError;

export class NetworkError {}

export class DataServiceApiError {
  constructor(
    readonly message: string,
    readonly error: string,
    readonly statusCode: number,
    readonly requestId?: string | null,
  ) {}
}

const XRequestIdHeader = 'x-request-id';

export async function withReThrowingDataServiceError<T>(fn: Promise<T>) {
  try {
    return await fn;
  } catch (e) {
    const err = e as AxiosError;
    if (!err.response) {
      throw new NetworkError();
    }
    const data = err.response.data as RawDataServiceApiError;
    const requestId =
      (err.config.headers &&
        (err.config.headers[XRequestIdHeader] as string)) ??
      null;
    throw new DataServiceApiError(
      data.message,
      err.response.statusText,
      Number(err.response.status),
      requestId,
    );
  }
}
