import type { TokenProvider } from '@auth/internal/token-provider';
import type { AddressDto, AddressTypeDto } from './data-service-dapps-api';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';
import axios from 'axios';

export interface DataServiceWalletAddressesApi {
  create(command: CreateAddressCommandDto): Promise<AddressDto>;

  patch(
    addressId: string,
    command: PatchAddressCommandDto,
  ): Promise<AddressDto>;

  delete(addressId: string): Promise<void>;

  find(addressId: string): Promise<AddressDto>;

  findAll(): Promise<AddressDto[]>;

  verify(
    addressId: string,
    command: VerifyAddressCommandDto,
  ): Promise<AddressDto>;

  resendVerificationCode(addressId: string): Promise<void>;
}

export interface CreateAddressCommandDto {
  readonly value: string;
  readonly type: AddressTypeDto;
}

export interface PatchAddressCommandDto {
  readonly value?: string;
}

export interface VerifyAddressCommandDto {
  readonly code: string;
}

export class DataServiceWalletAddressesApiClient
  implements DataServiceWalletAddressesApi
{
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async create(command: CreateAddressCommandDto): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<AddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/addresses`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async patch(
    addressId: string,
    command: PatchAddressCommandDto,
  ): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<AddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/addresses/${addressId}`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async delete(addressId: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete<AddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/addresses/${addressId}`,
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async find(addressId: string): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<AddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/addresses/${addressId}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async findAll(): Promise<AddressDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<AddressDto[]>(`${this.baseUrl}/api/v1/wallets/me/addresses`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async resendVerificationCode(addressId: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return await withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v1/wallets/me/addresses/${addressId}/resendVerificationCode`,
          {},
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async verify(
    addressId: string,
    command: VerifyAddressCommandDto,
  ): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<AddressDto>(
          `${this.baseUrl}/api/v1/wallets/me/addresses/${addressId}/verify`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
