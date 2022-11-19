import type { TokenProvider } from '../auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import type { WalletDto } from './data-service-dapps-api';
import axios from 'axios';

export interface DataServiceWalletsApiV1 {
  upsertWallet(walletDto: WalletDto): Promise<WalletDto>;
}

export class DataServiceWalletsApiClientV1
  implements DataServiceWalletsApiV1
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async upsertWallet(walletDto: WalletDto): Promise<WalletDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<WalletDto>(
          `${this.baseUrl}/api/v1/wallets/me/upsertWallet`,
          walletDto,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
