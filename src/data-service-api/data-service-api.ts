import type { TokenProvider } from './token-provider';
import axios, { AxiosError } from 'axios';

export class DataServiceApi {
  private constructor(readonly dialects: DataServiceDialectsApi) {}

  static create(baseUrl: string, tokenProvider: TokenProvider) {
    const dialectsApi = new DataServiceDialectsApiClient(
      baseUrl,
      tokenProvider,
    );
    return new DataServiceApi(dialectsApi);
  }

  static async withHttpErrorBodyParsing<T>(restCall: Promise<T>) {
    try {
      return await restCall;
    } catch (e) {
      const err = e as AxiosError;
      const data = err.response?.data;
      console.error(data);
      throw data;
    }
  }
}

export interface DataServiceDialectsApi {
  create(command: CreateDialectCommand): Promise<DialectAccountDto>;

  list(): Promise<DialectAccountDto[]>;

  get(publicKey: string): Promise<DialectAccountDto | null>;

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
    return DataServiceApi.withHttpErrorBodyParsing(
      axios
        .post<DialectAccountDto>(`${this.baseUrl}/v0/dialects`, command, {
          headers: { Authorization: `Bearer ${token.rawValue}` },
        })
        .then((it) => it.data),
    );
  }

  async list(): Promise<DialectAccountDto[]> {
    const token = await this.tokenProvider.get();
    return DataServiceApi.withHttpErrorBodyParsing(
      axios
        .get<DialectAccountDto[]>(`${this.baseUrl}/v0/dialects`, {
          headers: { Authorization: `Bearer ${token.rawValue}` },
        })
        .then((it) => it.data),
    );
  }

  async get(publicKey: string): Promise<DialectAccountDto | null> {
    // TODO: handle 404
    const token = await this.tokenProvider.get();
    return DataServiceApi.withHttpErrorBodyParsing(
      axios
        .get<DialectAccountDto>(`${this.baseUrl}/v0/dialects/${publicKey}`, {
          headers: { Authorization: `Bearer ${token.rawValue}` },
        })
        .then((it) => it.data),
    );
  }

  async delete(publicKey: string): Promise<void> {
    const token = await this.tokenProvider.get();
    return DataServiceApi.withHttpErrorBodyParsing(
      axios
        .delete<void>(`${this.baseUrl}/v0/dialects/${publicKey}`, {
          headers: { Authorization: `Bearer ${token.rawValue}` },
        })
        .then((it) => it.data),
    );
  }

  async sendMessage(
    publicKey: string,
    command: SendMessageCommand,
  ): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return DataServiceApi.withHttpErrorBodyParsing(
      axios
        .post<DialectAccountDto>(
          `${this.baseUrl}/v0/dialects/${publicKey}/messages`,
          command,
          {
            headers: { Authorization: `Bearer ${token.rawValue}` },
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
