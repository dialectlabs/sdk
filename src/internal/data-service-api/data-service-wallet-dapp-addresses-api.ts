import type { DappAddressDto } from '@data-service-api/data-service-dapps-api';
import type { TokenProvider } from '@auth/internal/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';
import axios from 'axios';

export interface DataServiceWalletDappAddressesApi {
  create(command: CreateDappAddressCommandDto): Promise<DappAddressDto>;

  patch(
    dappAddressId: string,
    command: PartialUpdateDappAddressCommandDto,
  ): Promise<DappAddressDto>;

  delete(dappAddressId: string): Promise<void>;

  find(dappAddressId: string): Promise<DappAddressDto>;

  findAll(query?: FindDappAddressesQuery): Promise<DappAddressDto[]>;
}

export interface CreateDappAddressCommandDto {
  readonly dappPublicKey: string;
  readonly addressId: string;
  readonly enabled: boolean;
}

export interface PartialUpdateDappAddressCommandDto {
  readonly enabled?: boolean;
}

export interface FindDappAddressesQuery {
  readonly dappPublicKey?: string;
  readonly addressIds?: string[];
}

export class DataServiceWalletDappAddressesApiClient
  implements DataServiceWalletDappAddressesApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async create(command: CreateDappAddressCommandDto): Promise<DappAddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<DappAddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/dappAddresses`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async delete(dappAddressId: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete<void>(
          `${this.baseUrl}/api/v1/wallets/me/dappAddresses/${dappAddressId}`,
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async find(dappAddressId: string): Promise<DappAddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappAddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/dappAddresses/${dappAddressId}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async findAll(query?: FindDappAddressesQuery): Promise<DappAddressDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappAddressDto[]>(
          `${this.baseUrl}/api/v1/wallets/me/dappAddresses`,
          {
            headers: createHeaders(token),
            ...(query && { params: query }),
          },
        )
        .then((it) => it.data),
    );
  }

  async patch(
    dappAddressId: string,
    command: PartialUpdateDappAddressCommandDto,
  ): Promise<DappAddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<DappAddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/dappAddresses/${dappAddressId}`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
