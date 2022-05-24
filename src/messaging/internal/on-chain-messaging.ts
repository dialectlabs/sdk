import type { Wallet } from '../../wallet-interfaces';
import type {
  CreateDialectCommand,
  Dialect,
  FindDialectQuery,
  Messaging,
} from './messaging.interface';
import type { DialectMember, SendMessageCommand } from './messaging.interface';
import type { Message, PublicKey } from '@solana/web3.js';

export class OnChainMessaging implements Messaging {
  constructor(private readonly wallet: Wallet) {}

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

export class Web3Dialect implements Dialect {
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
