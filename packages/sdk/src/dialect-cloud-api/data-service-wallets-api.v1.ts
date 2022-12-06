import type { Token } from '../auth/auth.interface';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import type { WalletDto } from './data-service-dapps-api';
import axios from 'axios';

export interface DataServiceWalletsApiV1 {
  upsertWallet(wallet: { publicKey: string }, token: Token): Promise<WalletDto>;
}

export class DataServiceWalletsApiClientV1 implements DataServiceWalletsApiV1 {
  constructor(private readonly baseUrl: string) {}

  async upsertWallet(
    wallet: { publicKey: string },
    token: Token,
  ): Promise<WalletDto> {
    return withReThrowingDataServiceError(
      axios
        .post<WalletDto>(`${this.baseUrl}/api/v1/wallets/me/`, wallet, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }
}
