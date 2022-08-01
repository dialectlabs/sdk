import axios from 'axios';
import type { TokenProvider } from '@auth/internal/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from '@data-service-api/data-service-api';

export interface DataServiceDialectsApi {
  create(command: CreateDialectCommand): Promise<DialectAccountDto>;

  findAll(query?: FindDialectQuery): Promise<DialectAccountDto[]>;

  find(publicKey: string): Promise<DialectAccountDto>;

  delete(publicKey: string): Promise<void>;

  sendMessage(
    publicKey: string,
    command: SendMessageCommand,
  ): Promise<DialectAccountDto>;

  findSummary(
    query: FindDialectSummaryByMembersQueryDto,
  ): Promise<DialectSummaryDto>;

  patchMember(
    dialectPublicKey: string,
    command: PatchMemberCommandDto,
  ): Promise<MemberDto>;
}

export class DataServiceDialectsApiClient implements DataServiceDialectsApi {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async patchMember(
    dialectPublicKey: string,
    command: PatchMemberCommandDto,
  ): Promise<MemberDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .patch<MemberDto>(
          `${this.baseUrl}/api/v1/dialects/${dialectPublicKey}/members/me`,
          command,
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
        .post<DialectAccountDto>(`${this.baseUrl}/api/v1/dialects`, command, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async findAll(query?: FindDialectQuery): Promise<DialectAccountDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectAccountDto[]>(`${this.baseUrl}/api/v1/dialects`, {
          headers: createHeaders(token),
          ...(query && { params: query }),
        })
        .then((it) => it.data),
    );
  }

  async find(publicKey: string): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectAccountDto>(
          `${this.baseUrl}/api/v1/dialects/${publicKey}`,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async delete(publicKey: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete<void>(`${this.baseUrl}/api/v1/dialects/${publicKey}`, {
          headers: createHeaders(token),
        })
        .then((it) => it.data),
    );
  }

  async sendMessage(
    publicKey: string,
    command: SendMessageCommand,
  ): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<DialectAccountDto>(
          `${this.baseUrl}/api/v1/dialects/${publicKey}/messages`,
          command,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  findSummary(
    query: FindDialectSummaryByMembersQueryDto,
  ): Promise<DialectSummaryDto> {
    return withReThrowingDataServiceError(
      axios
        .get<DialectSummaryDto>(`${this.baseUrl}/api/v1/dialects/summary`, {
          headers: createHeaders(),
          ...(query && { params: query }),
        })
        .then((it) => it.data),
    );
  }
}

export interface CreateDialectCommand {
  readonly members: PostMemberDto[];
  readonly encrypted: boolean;
}

export interface PostMemberDto {
  readonly publicKey: string;
  readonly scopes: MemberScopeDto[];
}

export interface DialectAccountDto {
  readonly publicKey: string;
  readonly dialect: DialectDto;
}

export interface DialectDto {
  readonly members: MemberDto[];
  readonly messages: MessageDto[];
  // N.b. nextMessageIdx & lastMessageTimestamp are added only so we have schema parity with what's on chain.
  readonly nextMessageIdx: number;
  readonly lastMessageTimestamp: number;
  readonly encrypted: boolean;
}

export interface MemberDto {
  readonly publicKey: string;
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
}

export interface SendMessageCommand {
  readonly text: number[];
}

export interface FindDialectQuery {
  readonly memberPublicKey?: string;
}

export interface DialectSummaryDto {
  readonly publicKey: string;
  readonly memberSummaries: MemberSummaryDto[];
}

export interface MemberSummaryDto {
  readonly publicKey: string;
  readonly hasUnreadMessages: boolean;
}

export interface FindDialectSummaryByMembersQueryDto {
  readonly memberPublicKeys: string[];
}

export interface PatchMemberCommandDto {
  readonly lastReadMessageTimestamp?: number;
}
