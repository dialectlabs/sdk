import type { TokenProvider } from '@auth/internal/token-provider';
import axios from 'axios';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';

export interface DataServiceDappsApi {
  create(command: Omit<CreateDappCommandDto, 'publicKey'>): Promise<DappDto>;

  findAll(query?: FindDappQueryDto): Promise<DappDto[]>;

  find(): Promise<DappDto>;

  findAllDappAddresses(): Promise<DappAddressDto[]>;

  unicast(command: UnicastDappMessageCommandDto): Promise<void>;

  multicast(command: MulticastDappMessageCommandDto): Promise<void>;

  broadcast(command: BroadcastDappMessageCommandDto): Promise<void>;
}

export class DataServiceDappsApiClient implements DataServiceDappsApi {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async create(
    command: Omit<CreateDappCommandDto, 'publicKey'>,
  ): Promise<DappDto> {
    const token = await this.tokenProvider.get();
    const fullCommand: CreateDappCommandDto = {
      ...command,
      publicKey: token.body.sub,
    };
    return withReThrowingDataServiceError(
      axios
        .post<DappDto>(`${this.baseUrl}/api/v1/dapps`, fullCommand, {
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

  async find(): Promise<DappDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappDto>(`${this.baseUrl}/api/v1/dapps/${token.body.sub}`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async broadcast(command: BroadcastDappMessageCommandDto): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/messages/broadcast`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async multicast(command: MulticastDappMessageCommandDto): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/messages/multicast`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async unicast(command: UnicastDappMessageCommandDto): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}/messages/unicast`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then(),
    );
  }

  async findAll(query?: FindDappQueryDto): Promise<DappDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DappDto[]>(`${this.baseUrl}/api/v1/dapps`, {
          headers: createHeaders(token),
          ...(query && { params: query }),
        })
        .then((it) => it.data),
    );
  }
}

export class DappDto {
  readonly id!: string;
  readonly publicKey!: string;
  readonly name!: string;
  readonly description?: string;
  readonly verified!: boolean;
}

export class CreateDappCommandDto {
  readonly name!: string;
  readonly publicKey!: string;
  readonly description?: string;
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
  PhoneNumber = 'PHONE_NUMBER',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}

export class UnicastDappMessageCommandDto {
  title!: string;
  message!: string;
  recipientPublicKey!: string;
  notificationTypeId?: string;
}

export class MulticastDappMessageCommandDto {
  title!: string;
  message!: string;
  recipientPublicKeys!: string[];
  notificationTypeId?: string;
}

export class BroadcastDappMessageCommandDto {
  title!: string;
  message!: string;
  notificationTypeId?: string;
}

export class FindDappQueryDto {
  verified?: boolean;
}
