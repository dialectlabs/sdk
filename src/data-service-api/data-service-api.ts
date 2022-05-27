import type { TokenProvider } from './token-provider';
import axios, { AxiosError } from 'axios';
import type { PublicKey } from '@solana/web3.js';

export class DataServiceApi {
  private constructor(readonly dialects: DataServiceDialectsApi) {}

  static create(baseUrl: string, tokenProvider: TokenProvider) {
    const dialectsApi = new DataServiceDialectsApiClient(
      baseUrl,
      tokenProvider,
    );
    return new DataServiceApi(dialectsApi);
  }
}

export interface DataServiceDialectsApi {
  create(command: CreateDialectCommand): Promise<DialectAccountDto>;

  list(): Promise<DialectAccountDto[]>;

  get(publicKey: PublicKey): Promise<DialectAccountDto | null>;

  delete(publicKey: PublicKey): Promise<void>;

  sendMessage(
    publicKey: PublicKey,
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
    try {
      return await axios
        .post<DialectAccountDto>(`${this.baseUrl}/v0/dialects`, command, {
          headers: { Authorization: `Bearer ${token.rawValue}` },
        })
        .then((it) => it.data);
    } catch (e) {
      const err = e as AxiosError;
      const data = err.response?.data as {
        // TODO: create rest exception mapper
        statusCode: number;
      };
      throw new Error(JSON.stringify(data));
    }
  }

  async list(): Promise<DialectAccountDto[]> {
    const token = await this.tokenProvider.get();
    return axios
      .get<DialectAccountDto[]>(`${this.baseUrl}/v0/dialects`, {
        headers: { Authorization: `Bearer ${token.rawValue}` },
      })
      .then((it) => it.data);
  }

  async get(publicKey: PublicKey): Promise<DialectAccountDto | null> {
    // TODO: handle 404
    const token = await this.tokenProvider.get();
    return axios
      .get<DialectAccountDto>(`${this.baseUrl}/v0/dialects/${publicKey}`, {
        headers: { Authorization: `Bearer ${token.rawValue}` },
      })
      .then((it) => it.data);
  }

  async delete(publicKey: PublicKey): Promise<void> {
    const token = await this.tokenProvider.get();
    return axios
      .delete<void>(`${this.baseUrl}/api/dialects/v0/${publicKey}`, {
        headers: { Authorization: `Bearer ${token.rawValue}` },
      })
      .then((it) => it.data);
  }

  async sendMessage(
    publicKey: PublicKey,
    command: SendMessageCommand,
  ): Promise<DialectAccountDto> {
    const token = await this.tokenProvider.get();
    return axios
      .post<DialectAccountDto>(
        `${this.baseUrl}/v0/dialects/${publicKey}/messages`,
        command,
        {
          headers: { Authorization: `Bearer ${token.rawValue}` },
        },
      )
      .then((it) => it.data);
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
  Admin = 'ADMIN',
  Write = 'WRITE',
}

export class MessageDto {
  readonly owner!: string;
  readonly text!: Buffer;
  readonly timestamp!: number;
}

export class SendMessageCommand {
  readonly text!: Buffer;
}
