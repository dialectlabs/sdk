import axios from 'axios';
import type { TokenProvider } from '../../core/auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';

export type AddressTypeV0 = 'email' | 'sms' | 'telegram' | 'wallet';

export interface CreateAddressCommandV0 {
  type: string;
  value: string;
  enabled: boolean;
}

export interface DeleteAddressCommandV0 {
  id: string;
}

export interface DappAddressDtoV0 {
  id: string;
  type: AddressTypeV0;
  verified: boolean;
  addressId: string;
  dapp: string;
  enabled: boolean;
  value: string;
}

export interface DataServiceWalletsApiV0 {
  createDappAddress(
    command: CreateAddressCommandV0,
    dapp: string,
  ): Promise<DappAddressDtoV0>;

  deleteDappAddress(command: DeleteAddressCommandV0): Promise<void>;

  findAllDappAddresses(dappPublicKey: string): Promise<DappAddressDtoV0[]>;
}

export class DataServiceWalletsApiClientV0 implements DataServiceWalletsApiV0 {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async createDappAddress(
    command: CreateAddressCommandV0,
    dapp: string,
  ): Promise<DappAddressDtoV0> {
    const token = await this.tokenProvider.get();
    const headers = createHeaders(token);
    return withReThrowingDataServiceError(
      axios
        .post<DappAddressDtoV0>(
          `${this.baseUrl}/v0/wallets/${token.body.sub}/dapps/${dapp}/addresses`,
          command,
          {
            headers: headers,
          },
        )
        .then((it) => it.data),
    );
  }

  async deleteDappAddress(command: DeleteAddressCommandV0): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete(
          `${this.baseUrl}/v0/wallets/${token.body.sub}/addresses/${command.id}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async findAllDappAddresses(dapp: string): Promise<DappAddressDtoV0[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappAddressDtoV0[]>(
          `${this.baseUrl}/v0/wallets/${token.body.sub}/dapps/${dapp}/addresses`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
