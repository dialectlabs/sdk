import type { TokenProvider } from '../../auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';
import type { NotificationTypeDto } from './data-service-wallet-notification-subscriptions-api';
import type { NotificationSubscriptionDto } from './data-service-wallet-notification-subscriptions-api';

export interface DataServiceDappNotificationSubscriptionsApi {
  findAll(): Promise<DappNotificationSubscriptionDto[]>;
}

export class DataServiceDappNotificationSubscriptionsApiClient
  implements DataServiceDappNotificationSubscriptionsApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async findAll(): Promise<DappNotificationSubscriptionDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappNotificationSubscriptionDto[]>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/notificationSubscriptions`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}

export class DappNotificationSubscriptionDto {
  notificationType!: NotificationTypeDto;
  subscriptions!: NotificationSubscriptionDto[];
}
