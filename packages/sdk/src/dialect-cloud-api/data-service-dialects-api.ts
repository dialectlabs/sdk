import type { TokenProvider } from '../auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';

export interface DataServiceDialectsApi {
  create(command: CreateDialectCommand): Promise<DialectAccountDto>;

  findAll(): Promise<DialectAccountDto[]>;

  find(dialectId: string): Promise<DialectAccountDto>;

  findByMembers(
    query: FindDialectByMembersQueryDto,
  ): Promise<DialectAccountDto>;

  delete(dialectId: string): Promise<void>;

  sendMessage(dialectId: string, command: SendMessageCommand): Promise<void>;

  getMessages(dialectId: string): Promise<MessagesDto>;

  findSummary(query: FindDialectByMembersQueryDto): Promise<DialectSummaryDto>;

  findSummaryAll(query: FindDialectsSummaryDto): Promise<DialectsSummaryDto>;

  patch(
    dialectId: string,
    command: PatchDialectCommand,
  ): Promise<DialectAccountDto>;

  addMembers(dialectId: string, members: AddMembersCommand): Promise<void>;

  removeMember(dialectId: string, memberAddress: string): Promise<void>;

  markAsRead(dialectId: string): Promise<void>;
}

export class DataServiceDialectsApiClient implements DataServiceDialectsApi {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async markAsRead(dialectId: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v2/dialects/${dialectId}/markAsRead`,
          {},
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async create(command: CreateDialectCommand): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<DialectAccountDto>(`${this.baseUrl}/api/v2/dialects`, command, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async findAll(): Promise<DialectAccountDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectAccountDto[]>(`${this.baseUrl}/api/v2/dialects`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async find(id: string): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectAccountDto>(`${this.baseUrl}/api/v2/dialects/${id}`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async findByMembers(
    query: FindDialectByMembersQueryDto,
  ): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectAccountDto>(
          `${this.baseUrl}/api/v2/dialects/search/byMembers`,
          {
            headers: createHeaders(token),
            params: query,
          },
        )
        .then((it) => it.data),
    );
  }

  async delete(id: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete<void>(`${this.baseUrl}/api/v2/dialects/${id}`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async patch(
    id: string,
    command: PatchDialectCommand,
  ): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<DialectAccountDto>(
          `${this.baseUrl}/api/v2/dialects/${id}`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async sendMessage(id: string, command: SendMessageCommand): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<void>(`${this.baseUrl}/api/v2/dialects/${id}/messages`, command, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async getMessages(id: string): Promise<MessagesDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<MessagesDto>(`${this.baseUrl}/api/v2/dialects/${id}/messages`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  findSummary(query: FindDialectByMembersQueryDto): Promise<DialectSummaryDto> {
    return withReThrowingDataServiceError(
      axios
        .get<DialectSummaryDto>(`${this.baseUrl}/api/v2/dialects/summary`, {
          headers: createHeaders(),
          ...(query && { params: query }),
        })
        .then((it) => it.data),
    );
  }

  findSummaryAll(query: FindDialectsSummaryDto): Promise<DialectsSummaryDto> {
    return withReThrowingDataServiceError(
      axios
        .get<DialectsSummaryDto>(
          `${this.baseUrl}/api/v2/dialects/summary/all`,
          {
            headers: createHeaders(),
            params: query,
          },
        )
        .then((it) => it.data),
    );
  }

  async addMembers(
    dialectId: string,
    members: AddMembersCommand,
  ): Promise<void> {
    const token = await this.tokenProvider.get();
    await withReThrowingDataServiceError(
      axios
        .post<void>(
          `${this.baseUrl}/api/v2/dialects/${dialectId}/members`,
          members,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async removeMember(dialectId: string, memberAddress: string): Promise<void> {
    const token = await this.tokenProvider.get();
    await withReThrowingDataServiceError(
      axios
        .delete<void>(
          `${this.baseUrl}/api/v2/dialects/${dialectId}/members/${memberAddress}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }
}

export interface CreateDialectCommand {
  readonly members: PostMemberDto[];
  readonly encrypted: boolean;
}

export interface AddMembersCommand {
  readonly members: PostMemberDto[];
}

export interface PostMemberDto {
  readonly address: string;
  readonly scopes: MemberScopeDto[];
}

export interface DialectAccountDto {
  readonly id: string;
  readonly dialect: DialectDto;
}

export interface DialectDto {
  readonly members: MemberDto[];
  readonly lastMessage?: MessageDto;
  readonly updatedAt: number;
  readonly encrypted: boolean;
  readonly groupName?: string;
}

export interface MemberDto {
  readonly address: string;
  readonly scopes: MemberScopeDto[];
  readonly lastReadMessageTimestamp: number;
}

export enum MemberScopeDto {
  ADMIN = 'ADMIN',
  WRITE = 'WRITE',
}

export interface MessageDto {
  readonly owner: string;
  readonly text: number[];
  readonly timestamp: number;
  readonly deduplicationId?: string;
}

export interface MessagesDto {
  readonly messages: MessageDto[];
}

export interface SendMessageCommand {
  readonly text: number[];
  readonly deduplicationId?: string;
}

export interface PatchDialectCommand {
  readonly groupName: string;
}

export interface DialectSummaryDto {
  readonly id: string;
  readonly memberSummaries: MemberSummaryDto[];
}

export interface DialectsSummaryDto {
  readonly unreadMessagesCount: number;
}

export interface MemberSummaryDto {
  readonly address: string;
  readonly hasUnreadMessages: boolean;
  readonly unreadMessagesCount: number;
}

export interface FindDialectByMembersQueryDto {
  readonly memberAddresses: string[];
}

export interface FindDialectsSummaryDto {
  readonly address: string;
}
