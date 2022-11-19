import type { DataServiceDialectsApi } from './data-service-dialects-api';
import type { DataServiceWalletNotificationSubscriptionsApi } from './data-service-wallet-notification-subscriptions-api';
import type { DataServiceWalletsApiV0 } from './data-service-wallets-api.v0';
import type { DataServiceWalletDappAddressesApi } from './data-service-wallet-dapp-addresses-api';
import type { DataServiceWalletAddressesApi } from './data-service-wallet-addresses-api';
import type { Token } from '../auth/auth.interface';
import type { DataServiceDappsApi } from './data-service-dapps-api';
import type { DataServicePushNotificationSubscriptionsApi } from './data-service-push-notification-subscriptions-api';
import { nanoid } from 'nanoid';
import type { DataServiceDappNotificationTypesApi } from './data-service-dapp-notification-types-api';
import type { DataServiceWalletMessagesApi } from './data-service-wallet-messages-api';
import type { AxiosError } from 'axios';
import type { DataServiceDappNotificationSubscriptionsApi } from './data-service-dapp-notification-subscriptions-api';
import type { DataServiceHealthApi } from './data-service-health-api';
import { SDK_VERSION } from '../version';
import type { DataServiceWalletsApiV1 } from './data-service-wallets-api.v1';

export class DataServiceApi {
  constructor(
    readonly threads: DataServiceDialectsApi,
    readonly dapps: DataServiceDappsApi,
    readonly dappNotificationTypes: DataServiceDappNotificationTypesApi,
    readonly dappNotificationSubscriptions: DataServiceDappNotificationSubscriptionsApi,
    readonly walletsV0: DataServiceWalletsApiV0,
    readonly walletsV1: DataServiceWalletsApiV1,
    readonly walletAddresses: DataServiceWalletAddressesApi,
    readonly walletDappAddresses: DataServiceWalletDappAddressesApi,
    readonly walletMessages: DataServiceWalletMessagesApi,
    readonly walletNotificationSubscriptions: DataServiceWalletNotificationSubscriptionsApi,
    readonly pushNotificationSubscriptions: DataServicePushNotificationSubscriptionsApi,
    readonly health: DataServiceHealthApi,
  ) {}
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
const XClientNameHeader = 'x-client-name';
const XClientVersionHeader = 'x-client-version';

export function createHeaders(token?: Token) {
  return {
    ...(token && {
      Authorization: `Bearer ${token.rawValue}`,
    }),
    [XRequestIdHeader]: nanoid(),
    [XClientNameHeader]: 'dialect-sdk',
    [XClientVersionHeader]: SDK_VERSION,
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
