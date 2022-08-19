
import type { Backend } from '@sdk/sdk.interface';
import type { WalletAddress } from '../internal/wallet/wallet-address';

export interface Messaging {
  findAll(): Promise<Thread[]>;

  create(command: CreateThreadCommand): Promise<Thread>;

  find(query: FindThreadQuery): Promise<Thread | null>;

  findSummary(
    query: FindThreadByOtherMemberQuery,
  ): Promise<ThreadSummary | null>;

  findSummaryAll(): Promise<ThreadsGeneralSummary | null>;
}

export interface ThreadsGeneralSummary {
  unreadMessagesCount: number;
}

export interface ThreadSummary {
  id: ThreadId;
  me: ThreadMemberSummary;
}

export interface ThreadMemberSummary {
  publicKey: WalletAddress;
  hasUnreadMessages: boolean;
}

export interface SendMessageCommand {
  text: string;
}

export interface ThreadMessage {
  text: string;
  timestamp: Date;
  author: ThreadMember;
}

export interface CreateThreadCommand {
  me: Omit<ThreadMember, 'publicKey' | 'lastReadMessageTimestamp'>;
  otherMembers: Omit<ThreadMember, 'lastReadMessageTimestamp'>[];
  encrypted: boolean;
  backend?: Backend;
}

export type FindThreadQuery =
  | FindThreadByIdQuery
  | FindThreadByOtherMemberQuery;

export interface FindThreadByIdQuery {
  id: ThreadId;
}

export interface FindThreadByOtherMemberQuery {
  otherMembers: WalletAddress[];
}

export interface FindThreadSummaryByMembers {
  me: WalletAddress;
  otherMembers: WalletAddress[];
}

export interface ThreadIdProps {
  address: WalletAddress;
  backend?: Backend;
}

export class ThreadId {
  readonly address!: WalletAddress;
  readonly backend?: Backend;

  constructor({ address, backend }: ThreadIdProps) {
    this.address = address;
    this.backend = backend;
  }

  public equals(other: ThreadId): boolean {
    return this.address.equals(other.address) && this.backend === other.backend;
  }

  public toString(): string {
    return this.backend
      ? this.backend.toString() + ':' + this.address.toString()
      : this.address.toString();
  }
}

export interface Thread {
  id: ThreadId;
  me: ThreadMember;
  otherMembers: ThreadMember[];
  encryptionEnabled: boolean;
  canBeDecrypted: boolean;
  backend: Backend;
  updatedAt: Date;

  messages(): Promise<ThreadMessage[]>;

  send(command: SendMessageCommand): Promise<void>;

  delete(): Promise<void>;

  setLastReadMessageTime(time: Date): Promise<void>;
}

export interface ThreadMember {
  publicKey: WalletAddress;
  scopes: ThreadMemberScope[];
  // lastReadMessageTimestamp: Date;
}

export enum ThreadMemberScope {
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}
