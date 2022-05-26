import type { Wallet } from '../../wallet-interfaces';
import type {
  CreateDialectCommand,
  Dialect,
  DialectMember,
  FindDialectQuery,
  Message,
  Messaging,
  SendMessageCommand,
} from './messaging.interface';
import type { PublicKey } from '@solana/web3.js';

export class OnChainMessaging implements Messaging {
  constructor(private readonly wallet: Wallet) {}

  create(command: CreateDialectCommand): Promise<Dialect> {
    throw new Error('Not implemented');
  }

  find(query: FindDialectQuery): Promise<Dialect | null> {
    throw new Error('Not implemented');
  }

  list(): Promise<Dialect[]> {
    throw new Error('Not implemented');
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
    throw new Error('Not implemented');
  }

  messages(): Promise<Message[]> {
    throw new Error('Not implemented');
  }

  send(command: SendMessageCommand): Promise<void> {
    throw new Error('Not implemented');
  }
}
