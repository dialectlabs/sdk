import {
  DataServiceDialectsApi,
  DataServiceDialectsApiClient,
} from './data-service-dialects-api';
import {
  DataServiceWalletNotificationSubscriptionsApi,
  DataServiceWalletNotificationSubscriptionsApiClient,
} from './data-service-wallet-notification-subscriptions-api';
import type { DataServiceWalletsApiV0 } from './data-service-wallets-api.v0';
import { DataServiceWalletsApiClientV0 } from './data-service-wallets-api.v0';
import type { DataServiceWalletDappAddressesApi } from './data-service-wallet-dapp-addresses-api';
import { DataServiceWalletDappAddressesApiClient } from './data-service-wallet-dapp-addresses-api';
import type { DataServiceWalletAddressesApi } from './data-service-wallet-addresses-api';
import { DataServiceWalletAddressesApiClient } from './data-service-wallet-addresses-api';
import type { Token } from '../core/auth/auth.interface';
import type { DataServiceDappsApi } from './data-service-dapps-api';
import { DataServiceDappsApiClient } from './data-service-dapps-api';
import {
  DataServicePushNotificationSubscriptionsApi,
  DataServicePushNotificationSubscriptionsApiClient,
} from './data-service-push-notification-subscriptions-api';
import { nanoid } from 'nanoid';
import type { TokenProvider } from '../core/auth/token-provider';
import {
  DataServiceDappNotificationTypesApi,
  DataServiceDappNotificationTypesApiClient,
} from './data-service-dapp-notification-types-api';
import {
  DataServiceWalletMessagesApi,
  DataServiceWalletMessagesApiClient,
} from './data-service-wallet-messages-api';
import type { AxiosError } from 'axios';
import type { DataServiceDappNotificationSubscriptionsApi } from './data-service-dapp-notification-subscriptions-api';
import { DataServiceDappNotificationSubscriptionsApiClient } from './data-service-dapp-notification-subscriptions-api';
import type { DataServiceHealthApi } from './data-service-health-api';
import { DataServiceHealthApiClient } from './data-service-health-api';

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
    readonly health: DataServiceHealthApi,
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
    const health = new DataServiceHealthApiClient(baseUrl);

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
      health,
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
