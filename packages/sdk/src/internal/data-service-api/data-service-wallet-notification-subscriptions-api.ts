import type { WalletDto } from './data-service-dapps-api';
import type { TokenProvider } from '../../core/auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';

export interface FindNotificationSubscriptionQueryDto {
  readonly dappPublicKey: string;
}

export interface WalletNotificationSubscriptionDto {
  notificationType: NotificationTypeDto;
  subscription: NotificationSubscriptionDto;
}

export class NotificationSubscriptionDto {
  wallet!: WalletDto;
  config!: NotificationConfigDto;
}

export interface NotificationTypeDto {
  id: string;
  name: string;
  humanReadableId: string;
  trigger?: string;
  orderingPriority?: number;
  tags: string[];
  defaultConfig: NotificationConfigDto;
  dappId: string;
}

export interface NotificationConfigDto {
  enabled: boolean;
}

export interface UpsertNotificationSubscriptionCommandDto {
  readonly notificationTypeId: string;
  readonly config: NotificationConfigDto;
}

export interface DataServiceWalletNotificationSubscriptionsApi {
  findAll(
    query: FindNotificationSubscriptionQueryDto,
  ): Promise<WalletNotificationSubscriptionDto[]>;

  upsert(
    command: UpsertNotificationSubscriptionCommandDto,
  ): Promise<WalletNotificationSubscriptionDto>;
}

export class DataServiceWalletNotificationSubscriptionsApiClient
  implements DataServiceWalletNotificationSubscriptionsApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async findAll(
    query: FindNotificationSubscriptionQueryDto,
  ): Promise<WalletNotificationSubscriptionDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<WalletNotificationSubscriptionDto[]>(
          `${this.baseUrl}/api/v1/wallets/me/notificationSubscriptions`,
          {
            headers: createHeaders(token),
            params: query,
          },
        )
        .then((it) => it.data),
    );
  }

  async upsert(
    command: UpsertNotificationSubscriptionCommandDto,
  ): Promise<WalletNotificationSubscriptionDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<WalletNotificationSubscriptionDto>(
          `${this.baseUrl}/api/v1/wallets/me/notificationSubscriptions`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
