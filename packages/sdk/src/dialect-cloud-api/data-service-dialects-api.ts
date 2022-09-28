import type { TokenProvider } from '../auth/token-provider';
import {
  createHeaders,
  withReThrowingDataServiceError,
} from './data-service-api';
import axios from 'axios';

export interface DataServiceDialectsApi {
  create(command: CreateDialectCommand): Promise<DialectAccountDto>;

  findAll(query?: FindDialectQuery): Promise<DialectAccountDto[]>;

  find(id: string): Promise<DialectAccountDto>;

  delete(id: string): Promise<void>;

  sendMessage(
    publicKey: string,
    command: SendMessageCommand,
  ): Promise<DialectAccountDto>;

  findSummary(
    query: FindDialectSummaryByMembersQueryDto,
  ): Promise<DialectSummaryDto>;

  findSummaryAll(query: FindDialectsSummaryDto): Promise<DialectsSummaryDto>;

  addMembers(dialectId: string, members: AddMembersCommand): Promise<void>;

  removeMember(dialectId: string, memberPublicKey: string): Promise<void>;

  markAsRead(dialectId: string): Promise<void>;

  // patchMember(
  //   dialectPublicKey: string,
  //   command: PatchMemberCommandDto,
  // ): Promise<MemberDto>;
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

  // async patchMember(
  //   dialectPublicKey: string,
  //   command: PatchMemberCommandDto,
  // ): Promise<MemberDto> {
  //   const token = await this.tokenProvider.get();
  //   return withReThrowingDataServiceError(
  //     axios
  //       .patch<MemberDto>(
  //         `${this.baseUrl}/api/v1/dialects/${dialectPublicKey}/members/me`,
  //         command,
  //         {
  //           headers: createHeaders(token),
  //         },
  //       )
  //       .then((it) => it.data),
  //   );
  // }

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

  async findAll(query?: FindDialectQuery): Promise<DialectAccountDto[]> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .get<DialectAccountDto[]>(`${this.baseUrl}/api/v2/dialects`, {
          headers: createHeaders(token),
          ...(query && { params: query }),
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

  async sendMessage(
    id: string,
    command: SendMessageCommand,
  ): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .post<DialectAccountDto>(
          `${this.baseUrl}/api/v2/dialects/${id}/messages`,
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
    return withReThrowingDataServiceError(
      axios
        .put<void>(
          `${this.baseUrl}/api/v2/dialects/${dialectId}/members`,
          members,
          {
            headers: createHeaders(token),
          },
        )
        .then((it) => it.data),
    );
  }

  async removeMember(
    dialectId: string,
    memberPublicKey: string,
  ): Promise<void> {
    const token = await this.tokenProvider.get();
    return withReThrowingDataServiceError(
      axios
        .delete<void>(
          `${this.baseUrl}/api/v2/dialects/${dialectId}/members/${memberPublicKey}`,
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
  readonly publicKey: string;
  readonly scopes: MemberScopeDto[];
}

export interface DialectAccountDto {
  readonly id: string;
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
  readonly deduplicationId?: string;
}

export interface SendMessageCommand {
  readonly text: number[];
  readonly deduplicationId?: string;
}

export interface FindDialectQuery {
  readonly memberPublicKeys?: string[];
  readonly takeMessages?: number;
}

export interface DialectSummaryDto {
  readonly id: string;
  readonly memberSummaries: MemberSummaryDto[];
}

export interface DialectsSummaryDto {
  readonly unreadMessagesCount: number;
}

export interface MemberSummaryDto {
  readonly publicKey: string;
  readonly hasUnreadMessages: boolean;
  readonly unreadMessagesCount: number;
}

export interface FindDialectSummaryByMembersQueryDto {
  readonly memberPublicKeys: string[];
}

export interface FindDialectsSummaryDto {
  readonly publicKey: string;
}

export interface PatchMemberCommandDto {
  readonly lastReadMessageTimestamp?: number;
}
