import type {
  Dialect,
  DialectMember,
  Messaging,
} from './internal/messaging.interface';
import type { PublicKey } from '@solana/web3.js';
import type { DialectWalletAdapterDecorator } from '../internal/dialect-wallet-adapter';

export interface MessagingFacade {
  list(): Promise<Dialect[]>;

  create(command: CreateDialectCommand): Promise<Dialect>;

  find(query: FindDialectQuery): Promise<Dialect | null>;
}

export interface CreateDialectCommand {
  me: Omit<DialectMember, 'publicKey'>;
  otherMember: DialectMember;
  enableEncryption: boolean;
}

export type FindDialectQuery =
  | FindDialectByMemberQuery
  | FindDialectByAddressQuery;

export interface FindDialectByMemberQuery {
  otherMember: PublicKey;
}

export interface FindDialectByAddressQuery {
  address: PublicKey;
}

// export enum StorageType {
//   OnChain = 'ON_CHAIN',
//   OffChain = 'OFF_CHAIN',
// }

export class MessagingFacadeImpl implements MessagingFacade {
  constructor(
    private readonly dialectWalletAdapterDecorator: DialectWalletAdapterDecorator,
    private readonly onChainMessaging: Messaging,
    private readonly offChainMessaging: Messaging,
  ) {}

  create(command: CreateDialectCommand): Promise<Dialect> {
    throw new Error('Not implemented');
  }

  find(query: FindDialectByMemberQuery): Promise<Dialect | null> {
    throw new Error('Not implemented');
  }

  list(): Promise<Dialect[]> {
    throw new Error('Not implemented');
  }
}
