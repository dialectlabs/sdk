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
  ): Promise<DialectAccountDto | null>;
}

export class DataServiceDialectsApiClient implements DataServiceDialectsApi {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

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
}

export class CreateDialectCommand {
  readonly members!: PostMemberDto[];
  readonly encrypted!: boolean;
}

export class PostMemberDto {
  readonly publicKey!: string;
  readonly scopes!: MemberScopeDto[];
}

export class DialectAccountDto {
  readonly publicKey!: string;
  readonly dialect!: DialectDto;
}

export class DialectDto {
  readonly members!: MemberDto[];
  readonly messages!: MessageDto[];
  // N.b. nextMessageIdx & lastMessageTimestamp are added only so we have schema parity with what's on chain.
  readonly nextMessageIdx!: number;
  readonly lastMessageTimestamp!: number;
  readonly encrypted!: boolean;
}

export class MemberDto {
  readonly publicKey!: string;
  readonly scopes!: MemberScopeDto[];
}

export enum MemberScopeDto {
  ADMIN = 'ADMIN',
  WRITE = 'WRITE',
}

export class MessageDto {
  readonly owner!: string;
  readonly text!: number[];
  readonly timestamp!: number;
}

export class SendMessageCommand {
  readonly text!: number[];
}

export class FindDialectQuery {
  readonly memberPublicKey?: string;
}
