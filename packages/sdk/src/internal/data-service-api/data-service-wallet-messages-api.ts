import type { TokenProvider } from '../../core/auth/token-provider';
import type { MessageDto } from './data-service-dialects-api';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';

export interface DataServiceWalletMessagesApi {
  findAllDappMessages(
    query?: FindWalletMessagesQueryDto,
  ): Promise<MessageDto[]>;
}

export interface FindWalletMessagesQueryDto {
  readonly skip?: number;
  readonly take?: number;
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
}
