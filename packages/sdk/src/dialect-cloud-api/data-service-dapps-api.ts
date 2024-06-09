import type { TokenProvider } from '../auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';
import type { BlockchainType } from '../dapp/dapp.interface';

export interface DataServiceDappsApi {
  create(command: Omit<CreateDappCommandDto, 'publicKey'>): Promise<DappDto>;

  patch(command: PatchDappCommandDto): Promise<DappDto>;

  findAll(query?: FindDappQueryDto): Promise<DappDto[]>;

  find(dappAddress?: string): Promise<DappDto>;

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

  async patch(command: PatchDappCommandDto): Promise<DappDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<DappDto>(
          `${this.baseUrl}/api/v1/dapps/${token.body.sub}`,
          command,
          {
            headers: createHeaders(token),
          },
        )
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

  async find(dappAddress?: string): Promise<DappDto> {
    const token = await this.tokenProvider.get();
    const dappAddressToFind = dappAddress || token.body.sub;
    return withReThrowingDataServiceError(
      axios
        .get<DappDto>(`${this.baseUrl}/api/v1/dapps/${dappAddressToFind}`, {
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
          params: query,
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
  readonly websiteUrl?: string;
  readonly avatarUrl?: string;
  readonly heroUrl?: string;
  readonly telegramBotUserName!: string;
  readonly verified!: boolean;
  readonly blockchainType!: BlockchainType;
}

export class CreateDappCommandDto {
  readonly name!: string;
  readonly publicKey!: string;
  readonly description?: string;
  readonly websiteUrl?: string;
  readonly avatarUrl?: string;
  readonly heroUrl?: string;
  readonly telegramBotConfiguration?: DappTelegramBotConfigurationDto;
  readonly blockchainType?: string;
}

export class PatchDappCommandDto {
  readonly name?: string;
  readonly description?: string | null;
  readonly websiteUrl?: string | null;
  readonly avatarUrl?: string | null;
  readonly heroUrl?: string | null;
}

export class DappTelegramBotConfigurationDto {
  readonly token!: string;
}

export class DappAddressDto {
  readonly id!: string;
  readonly enabled!: boolean;
  readonly dapp!: DappDto;
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

// start actions
export enum DappMessageActionTypeDto {
  LINK = 'Link',
  SMART_MESSAGE = 'SmartMessage',
}

interface DappMessageActionBaseDto {
  type: DappMessageActionTypeDto;
}

export class DappMessageLinksActionDto implements DappMessageActionBaseDto {
  type!: DappMessageActionTypeDto.LINK;
  links!: DappMessageLinkAction[];
}

export class DappMessageLinkAction {
  label!: string;
  url!: string;
}

export class DappMessageSmartMessageActionDto
  implements DappMessageActionBaseDto
{
  type!: DappMessageActionTypeDto.SMART_MESSAGE;
  smartMessage!: SmartMessageDto;
}

export class SmartMessageDto {
  transactionServiceId!: string;
  transactionParams!: Record<string, any>;
}
// end actions

class SendDappMessageCommandDto {
  title?: string;
  message!: string;
  imageUrl?: string;
  notificationTypeId?: string;
  addressTypes?: AddressTypeDto[];
  // tags?: string[];
}

export class UnicastDappMessageCommandDto extends SendDappMessageCommandDto {
  recipientPublicKey!: string;
  actionsV2?: DappMessageLinksActionDto | DappMessageSmartMessageActionDto;
}

export class MulticastDappMessageCommandDto extends SendDappMessageCommandDto {
  recipientPublicKeys!: string[];
  actionsV2?: DappMessageLinksActionDto;
}

export class BroadcastDappMessageCommandDto extends SendDappMessageCommandDto {
  actionsV2?: DappMessageLinksActionDto;
}

export class FindDappQueryDto {
  verified?: boolean;
  blockchainType?: BlockchainType;
}
