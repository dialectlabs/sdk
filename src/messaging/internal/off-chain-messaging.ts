import type {
  CreateDialectCommand,
  Dialect,
  DialectMember,
  FindDialectQuery,
  Messaging,
  SendMessageCommand,
} from './messaging.interface';
import type { Message, PublicKey } from '@solana/web3.js';
import type { TokenProvider } from '../../data-service-api/token';

export class OffChainMessaging implements Messaging {
  constructor(
    private readonly me: PublicKey,
    private readonly tokenProvider: TokenProvider,
  ) {}

  create(command: CreateDialectCommand): Promise<Dialect> {
    return Promise.resolve(undefined);
  }

  find(query: FindDialectQuery): Promise<Dialect | null> {
    return Promise.resolve(undefined);
  }

  list(): Promise<Dialect[]> {
    return Promise.resolve([]);
  }
}

export class Web2Dialect implements Dialect {
  private constructor(
    readonly address: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encryptionEnabled: boolean,
  ) {}

  delete(): Promise<void> {
    return Promise.resolve(undefined);
  }

  messages(): Promise<Message[]> {
    return Promise.resolve([]);
  }

  send(command: SendMessageCommand): Promise<void> {
    return Promise.resolve(undefined);
  }
}
