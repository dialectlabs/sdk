import type { TokenProvider } from '@auth/internal/token-provider';
import type { AxiosError } from 'axios';
import type { DataServiceDialectsApi } from '@data-service-api/data-service-dialects-api';
import { DataServiceDialectsApiClient } from '@data-service-api/data-service-dialects-api';
import {
  DataServiceDappsApi,
  DataServiceDappsApiClient,
} from '@data-service-api/data-service-dapps-api';
import type { Token } from '@auth/auth.interface';
import {
  DataServiceWalletsApiClientV0,
  DataServiceWalletsApiV0,
} from '@data-service-api/data-service-wallets-api';
import { nanoid } from 'nanoid';

export class DataServiceApi {
  private constructor(
    readonly threads: DataServiceDialectsApi,
    readonly dapps: DataServiceDappsApi,
    readonly walletsV0: DataServiceWalletsApiV0,
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
    const walletsApiV0 = new DataServiceWalletsApiClientV0(
      baseUrl,
      tokenProvider,
    );
    return new DataServiceApi(dialectsApi, dappAddressesApi, walletsApiV0);
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

export function createHeaders(token: Token) {
  return {
    Authorization: `Bearer ${token.rawValue}`,
    [XRequestIdHeader]: nanoid(),
  };
}

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
