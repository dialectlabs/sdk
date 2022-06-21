import type { TokenProvider } from '@auth/internal/token-provider';
import axios from 'axios';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';

export interface DataServiceDappsApi {
  create(command: CreateDappCommandDto): Promise<DappDto>;

  findAllDappAddresses(): Promise<DappAddressDto[]>;
}

export class DataServiceDappsApiClient implements DataServiceDappsApi {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async create(command: CreateDappCommandDto): Promise<DappDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<DappDto>(`${this.baseUrl}/api/v1/dapps`, command, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async findAllDappAddresses(): Promise<DappAddressDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappAddressDto[]>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/dappAddresses`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}

export class DappDto {
  readonly id!: string;
  readonly publicKey!: string;
}

export class CreateDappCommandDto {
  readonly publicKey!: string;
}

export class DappAddressDto {
  readonly id!: string;
  readonly enabled!: boolean;
  readonly channelId?: string;
  readonly address!: AddressDto;
}

export class AddressDto {
  readonly id!: string;
  readonly type!: AddressTypeDto;
  readonly verified!: boolean;
  readonly value!: string;
  readonly wallet!: WalletDto;
}

export class WalletDto {
  readonly id!: string;
  readonly publicKey!: string;
}

export enum AddressTypeDto {
  Email = 'EMAIL',
  Sms = 'SMS',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}
