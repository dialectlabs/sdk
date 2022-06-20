import type { TokenProvider } from '@auth/internal/token-provider';
import type { AddressType } from '@address/addresses.interface';
import type { AddressDto } from './data-service-dapps-api';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';
import axios from 'axios';

export interface DataServiceWalletAddressesApi {
  create(command: CreateAddressCommandDto): Promise<AddressDto>;

  update(
    addressId: string,
    command: PartialUpdateAddressCommandDto,
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
  readonly type: AddressType;
}

export interface PartialUpdateAddressCommandDto {
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
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async update(
    addressId: string,
    command: PartialUpdateAddressCommandDto,
  ): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<AddressDto>(
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses/${addressId}`,
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
    await withReThrowingDataServiceError(
      axios
        .delete<AddressDto>(
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses/${addressId}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async find(addressId: string): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<AddressDto>(
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses/${addressId}`,
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
        .get<AddressDto[]>(
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async resendVerificationCode(addressId: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<void>(
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses/${addressId}/resendVerificationCode`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async verify(
    addressId: string,
    command: VerifyAddressCommandDto,
  ): Promise<AddressDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<AddressDto>(
          `${this.baseUrl}/api/v1/wallet/${token.body.sub}/addresses/${addressId}/verify`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}
