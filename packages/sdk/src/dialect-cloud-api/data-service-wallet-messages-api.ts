import type { TokenProvider } from '../auth/token-provider';
import type {
  DialectsSummaryDto,
  MessageDto,
} from './data-service-dialects-api';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';

export interface DataServiceWalletMessagesApi {
  findAllDappMessages(
    query?: FindWalletMessagesQueryDto,
  ): Promise<MessageDto[]>;

  dappMessagesSummary(
    query?: FindDappMessagesSummaryQueryDto,
  ): Promise<DialectsSummaryDto>;

  markAllDappMessagesAsRead(
    command?: MarkDappMessagesAsReadCommandDto,
  ): Promise<void>;
}

export interface FindDappMessagesSummaryQueryDto {
  readonly dappVerified?: boolean;
}

export interface MarkDappMessagesAsReadCommandDto {
  readonly dappVerified?: boolean;
}

export interface FindWalletMessagesQueryDto {
  readonly skip?: number;
  readonly take?: number;
  readonly dappVerified?: boolean;
}

export interface MarkDappMessagesAsReadCommandDto {
  readonly dappVerified?: boolean;
}

export class DataServiceWalletMessagesApiClient
  implements DataServiceWalletMessagesApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async findAllDappMessages(
    query?: FindWalletMessagesQueryDto,
  ): Promise<MessageDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<MessageDto[]>(`${this.baseUrl}/api/v1/wallets/me/dappMessages`, {
          headers: createHeaders(token),
          ...(query && { params: query }),
        })
        .then((it) => it.data),
    );
  }

  async dappMessagesSummary(
    query?: FindDappMessagesSummaryQueryDto,
  ): Promise<DialectsSummaryDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectsSummaryDto>(
          `${this.baseUrl}/api/v1/wallets/me/dappMessages/summary`,
          {
            headers: createHeaders(token),
            ...(query && { params: query }),
          },
        )
        .then((it) => it.data),
    );
  }

  async markAllDappMessagesAsRead(
    command?: MarkDappMessagesAsReadCommandDto,
  ): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v1/wallets/me/dappMessages/markAsRead`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
