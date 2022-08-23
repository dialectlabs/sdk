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
} from '@data-service-api/data-service-wallets-api.v0';
import { nanoid } from 'nanoid';
import {
  DataServiceWalletAddressesApi,
  DataServiceWalletAddressesApiClient,
} from '@data-service-api/data-service-wallet-addresses-api';
import {
  DataServiceWalletDappAddressesApi,
  DataServiceWalletDappAddressesApiClient,
} from '@data-service-api/data-service-wallet-dapp-addresses-api';
import {
  DataServiceWalletMessagesApi,
  DataServiceWalletMessagesApiClient,
} from '@data-service-api/data-service-wallet-messages-api';
import type { DataServiceDappNotificationTypesApi } from '@data-service-api/data-service-dapp-notification-types-api';
import { DataServiceDappNotificationTypesApiClient } from '@data-service-api/data-service-dapp-notification-types-api';
import type { DataServiceWalletNotificationSubscriptionsApi } from '@data-service-api/data-service-wallet-notification-subscriptions-api';
import { DataServiceWalletNotificationSubscriptionsApiClient } from '@data-service-api/data-service-wallet-notification-subscriptions-api';
import type { DataServiceDappNotificationSubscriptionsApi } from '@data-service-api/data-service-dapp-notification-subscriptions-api';
import { DataServiceDappNotificationSubscriptionsApiClient } from '@data-service-api/data-service-dapp-notification-subscriptions-api';
import {
  DataServicePushNotificationSubscriptionsApi,
  DataServicePushNotificationSubscriptionsApiClient,
} from './data-service-push-notification-subscriptions-api';
import type { TokenProvider } from '@auth/token-provider';

export class DataServiceApi {
  private constructor(
    readonly threads: DataServiceDialectsApi,
    readonly dapps: DataServiceDappsApi,
    readonly dappNotificationTypes: DataServiceDappNotificationTypesApi,
    readonly dappNotificationSubscriptions: DataServiceDappNotificationSubscriptionsApi,
    readonly walletsV0: DataServiceWalletsApiV0,
    readonly walletAddresses: DataServiceWalletAddressesApi,
    readonly walletDappAddresses: DataServiceWalletDappAddressesApi,
    readonly walletMessages: DataServiceWalletMessagesApi,
    readonly walletNotificationSubscriptions: DataServiceWalletNotificationSubscriptionsApi,
    readonly pushNotificationSubscriptions: DataServicePushNotificationSubscriptionsApi,
  ) {}

  static create(baseUrl: string, tokenProvider: TokenProvider) {
    const dialectsApi = new DataServiceDialectsApiClient(
      baseUrl,
      tokenProvider,
    );
    const dappsApiClient = new DataServiceDappsApiClient(
      baseUrl,
      tokenProvider,
    );
    const dappNotificationTypes = new DataServiceDappNotificationTypesApiClient(
      baseUrl,
      tokenProvider,
    );
    const dappNotificationSubscriptions =
      new DataServiceDappNotificationSubscriptionsApiClient(
        baseUrl,
        tokenProvider,
      );
    const walletsApiV0 = new DataServiceWalletsApiClientV0(
      baseUrl,
      tokenProvider,
    );
    const walletAddressesApi = new DataServiceWalletAddressesApiClient(
      baseUrl,
      tokenProvider,
    );
    const walletDappAddressesApi = new DataServiceWalletDappAddressesApiClient(
      baseUrl,
      tokenProvider,
    );
    const walletDappMessagesApi = new DataServiceWalletMessagesApiClient(
      baseUrl,
      tokenProvider,
    );
    const walletNotificationSubscriptions =
      new DataServiceWalletNotificationSubscriptionsApiClient(
        baseUrl,
        tokenProvider,
      );
    const pushNotificationSubscriptions =
      new DataServicePushNotificationSubscriptionsApiClient(
        baseUrl,
        tokenProvider,
      );
    return new DataServiceApi(
      dialectsApi,
      dappsApiClient,
      dappNotificationTypes,
      dappNotificationSubscriptions,
      walletsApiV0,
      walletAddressesApi,
      walletDappAddressesApi,
      walletDappMessagesApi,
      walletNotificationSubscriptions,
      pushNotificationSubscriptions,
    );
  }
}

interface RawDataServiceApiError {
  message: string;
}

export type DataServiceApiClientError = NetworkError | DataServiceApiError;

export class NetworkError {}

export class DataServiceApiError {
  constructor(
    readonly error: string,
    readonly statusCode: number,
    readonly message?: string | null,
    readonly requestId?: string | null,
  ) {}
}

const XRequestIdHeader = 'x-request-id';

export function createHeaders(token?: Token) {
  return {
    ...(token && {
      Authorization: `Bearer ${token.rawValue}`,
    }),
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
      err.response.statusText,
      Number(err.response.status),
      data.message,
      requestId,
    );
  }
}
