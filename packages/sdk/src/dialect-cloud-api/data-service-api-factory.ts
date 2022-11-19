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
import type { Token } from '../auth/auth.interface';
import type { DataServiceDappsApi } from './data-service-dapps-api';
import { DataServiceDappsApiClient } from './data-service-dapps-api';
import {
  DataServicePushNotificationSubscriptionsApi,
  DataServicePushNotificationSubscriptionsApiClient,
} from './data-service-push-notification-subscriptions-api';
import { nanoid } from 'nanoid';
import type { TokenProvider } from '../auth/token-provider';
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
import { SDK_VERSION } from '../version';
import { DataServiceApi } from './data-service-api';
import { DataServiceWalletsApiClientV1 } from './data-service-wallets-api.v1';

export class DataServiceApiFactory {
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
    const walletsApiV1 = new DataServiceWalletsApiClientV1(
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
      walletsApiV1,
      walletAddressesApi,
      walletDappAddressesApi,
      walletDappMessagesApi,
      walletNotificationSubscriptions,
      pushNotificationSubscriptions,
      health,
    );
  }
}
