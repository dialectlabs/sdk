import type { TokenProvider } from '../core/auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import type {
  NotificationConfigDto,
  NotificationTypeDto,
} from './data-service-wallet-notification-subscriptions-api';
import axios from 'axios';

export interface DataServiceDappNotificationTypesApi {
  create(
    command: CreateNotificationTypeCommandDto,
  ): Promise<NotificationTypeDto>;

  findAll(): Promise<NotificationTypeDto[]>;

  find(id: string): Promise<NotificationTypeDto>;

  patch(
    id: string,
    command: PatchNotificationTypeCommandDto,
  ): Promise<NotificationTypeDto>;

  delete(id: string): Promise<void>;
}

export class DataServiceDappNotificationTypesApiClient
  implements DataServiceDappNotificationTypesApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async create(
    command: CreateNotificationTypeCommandDto,
  ): Promise<NotificationTypeDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<NotificationTypeDto>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/notificationTypes`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async delete(id: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete<void>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/notificationTypes/${id}`,
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async find(id: string): Promise<NotificationTypeDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<NotificationTypeDto>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/notificationTypes/${id}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async findAll(): Promise<NotificationTypeDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<NotificationTypeDto[]>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/notificationTypes`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async patch(
    id: string,
    command: PatchNotificationTypeCommandDto,
  ): Promise<NotificationTypeDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<NotificationTypeDto>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/notificationTypes/${id}`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}

export interface PatchNotificationTypeCommandDto {
  name?: string;
  humanReadableId?: string;
  trigger?: string;
  orderingPriority?: number;
  tags?: string[];
  defaultConfig?: NotificationConfigDto;
}

export interface CreateNotificationTypeCommandDto {
  name: string;
  humanReadableId: string;
  trigger?: string;
  orderingPriority?: number;
  tags?: string[];
  defaultConfig: NotificationConfigDto;
}
