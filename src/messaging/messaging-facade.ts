import type {
  Dialect,
  DialectMember,
  Messaging,
} from './internal/messaging.interface';
import type {
  Web2EncryptedMessagingWallet,
  Web2Wallet,
  Web3EncryptedMessagingWallet,
  Web3Wallet,
} from '../wallet-interfaces';
import type { PublicKey } from '@solana/web3.js';

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

export type MessagingWallet =
  | Web2Wallet
  | Web2EncryptedMessagingWallet
  | Web3Wallet
  | Web3EncryptedMessagingWallet;

export class MessagingFacadeImpl implements MessagingFacade {
  constructor(
    private readonly wallet: MessagingWallet,
    private readonly onChainMessaging: Messaging,
    private readonly offChainMessaging: Messaging,
  ) {}

  create(command: CreateDialectCommand): Promise<Dialect> {
    return Promise.resolve(undefined);
  }

  find(query: FindDialectByMemberQuery): Promise<Dialect | null> {
    return Promise.resolve(undefined);
  }

  list(): Promise<Dialect[]> {
    return Promise.resolve([]);
  }
}
