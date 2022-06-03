import type {
  CreateDialectCommand,
  DialectMember,
  FindDialectQuery,
  Message,
  Messaging,
  SendMessageCommand,
  Thread,
} from '@messaging/messaging.interface';
import type { DataServiceMessaging } from './data-service-messaging';
import type { SolanaMessaging } from './solana-messaging';
import type { PublicKey } from '@solana/web3.js';
import { UnsupportedOperationError } from '@sdk/errors';

// TODO: implement after ux/ui decision made
export class MessagingFacade implements Messaging {
  constructor(
    private readonly dataServiceMessaging: DataServiceMessaging,
    private readonly solanaMessaging: SolanaMessaging,
  ) {}

  create(command: CreateDialectCommand): Promise<Thread> {
    throw new UnsupportedOperationError('Not implemented');
  }

  find(query: FindDialectQuery): Promise<Thread | null> {
    throw new UnsupportedOperationError('Not implemented');
  }

  findAll(): Promise<Thread[]> {
    throw new UnsupportedOperationError('Not implemented');
  }
}

export class ThreadFacade implements Thread {
  constructor(
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    readonly address: PublicKey,
    private readonly delegates: Thread[],
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
