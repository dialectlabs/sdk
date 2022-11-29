import type { Token } from '../auth/auth.interface';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import type { WalletDto } from './data-service-dapps-api';
import axios from 'axios';

export interface DataServiceWalletsApiV1 {
  upsertWallet(walletDto: WalletDto, token: Token): Promise<WalletDto>;
}

export class DataServiceWalletsApiClientV1
  implements DataServiceWalletsApiV1
{
  constructor(
    private readonly baseUrl: string,
  ) {}

  async upsertWallet(walletDto: WalletDto, token: Token): Promise<WalletDto> {
    return withReThrowingDataServiceError(
      axios
        .post<WalletDto>(
          `${this.baseUrl}/api/v1/wallets/me/`,
          walletDto,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
