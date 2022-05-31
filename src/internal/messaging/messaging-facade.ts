import type {
  CreateDialectCommand,
  Dialect,
  DialectMember,
  FindDialectQuery,
  Message,
  Messaging,
  SendMessageCommand,
} from '../../messaging.interface';
import type { DataServiceMessaging } from './data-service-messaging';
import type { SolanaMessaging } from './solana-messaging';
import type { PublicKey } from '@solana/web3.js';
import { UnsupportedOperationError } from '../../errors';

export class MessagingFacade implements Messaging {
  constructor(
    private readonly dataServiceMessaging: DataServiceMessaging,
    private readonly solanaMessaging: SolanaMessaging,
  ) {}

  create(command: CreateDialectCommand): Promise<Dialect> {
    throw new UnsupportedOperationError('Not implemented');
  }

  find(query: FindDialectQuery): Promise<Dialect | null> {
    throw new UnsupportedOperationError('Not implemented');
  }

  findAll(): Promise<Dialect[]> {
    throw new UnsupportedOperationError('Not implemented');
  }
}

export class DialectFacade implements Dialect {
  constructor(
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encrypted: boolean,
    readonly publicKey: PublicKey,
    private readonly delegates: Dialect[],
  ) {}

  delete(): Promise<void> {
    throw new UnsupportedOperationError('Not implemented');
  }

  messages(): Promise<Message[]> {
    throw new UnsupportedOperationError('Not implemented');
  }

  send(command: SendMessageCommand): Promise<void> {
    throw new UnsupportedOperationError('Not implemented');
  }
}
