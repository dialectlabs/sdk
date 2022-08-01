import type { TokenProvider } from '@auth/internal/token-provider';

import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';
import axios from 'axios';

export interface DataServicePushNotificationSubscriptionsApi {
  delete(physicalId: string): Promise<void>;
  upsert(command: UpsertPushNotificationSubscriptionCommandDto): Promise<PushNotificationSubscriptionDto>;
  get(physicalId: string): Promise<PushNotificationSubscriptionDto>;
}

export class DataServicePushNotificationSubscriptionsApiClient
  implements DataServicePushNotificationSubscriptionsApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async get(physicalId: string): Promise<PushNotificationSubscriptionDto> {
      const token = await this.tokenProvider.get();
      return withReThrowingDataServiceError(
          axios
            .get<PushNotificationSubscriptionDto>(
                `${this.baseUrl}/api/v1/pushNotificationSubscriptions/${physicalId}`,
                {
                    headers: createHeaders(token)
                }
            )
            .then((it) => it.data),
      );
  }

  async delete(physicalId: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
        axios
          .delete(
              `${this.baseUrl}/api/v1/pushNotificationSubscriptions/${physicalId}`,
              {
                  headers: createHeaders(token)
              }
          )
    );
  }
  
  async upsert(command: UpsertPushNotificationSubscriptionCommandDto): Promise<PushNotificationSubscriptionDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
        axios
          .post<PushNotificationSubscriptionDto>(
              `${this.baseUrl}/api/v1/pushNotificationSubscriptions`,
              command,
              {
                  headers: createHeaders(token)
              }
          )
          .then((it) => it.data),
    );
  }
}

export class PushNotificationSubscriptionDto {
  walletPublicKey!: string; // e.g. 'abdo094feCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h'
  physicalId!: string; // e.g. 'FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9' | 'dd96dec43fb81c97'
  token!: string;
}

export class UpsertPushNotificationSubscriptionCommandDto {
  physicalId!: string;
  token!: string;
}
