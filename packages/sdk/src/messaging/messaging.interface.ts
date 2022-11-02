import type { IllegalStateError, UnsupportedOperationError } from 'sdk/errors';
import type { Result, Option } from 'ts-results';
import type { AccountAddress } from '../auth/auth.interface';
import type { AuthenticationFailedError, IncorrectPublicKeyFormatError } from './ecdh-encryption';

export interface Messaging {
  type: string;

  findAll(): Promise<Result<Thread, IllegalStateError | IncorrectPublicKeyFormatError | AuthenticationFailedError>[]>;

  create(command: CreateThreadCommand): Promise<Result<Thread, IncorrectPublicKeyFormatError | AuthenticationFailedError | IllegalStateError>>;

  find(query: FindThreadQuery): Promise<Result<Option<Thread>, IllegalStateError | IncorrectPublicKeyFormatError | AuthenticationFailedError>>;

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
  address: AccountAddress;
  hasUnreadMessages: boolean;
  unreadMessagesCount: number;
}

export interface SendMessageCommand {
  text: string;
  deduplicationId?: string;
}

export interface ThreadMessage {
  text: string;
  timestamp: Date;
  author: ThreadMember;
  deduplicationId?: string;
}

export interface CreateThreadCommand {
  me: Omit<ThreadMember, 'address' | 'lastReadMessageTimestamp'>;
  otherMembers: Omit<ThreadMember, 'lastReadMessageTimestamp'>[];
  encrypted: boolean;
  type?: string;
}

export type FindThreadQuery =
  | FindThreadByIdQuery
  | FindThreadByOtherMemberQuery;

export interface FindThreadByIdQuery {
  id: ThreadId;
}

export interface FindThreadByOtherMemberQuery {
  otherMembers: AccountAddress[];
}

export interface FindThreadSummaryByMembers {
  me: AccountAddress;
  otherMembers: AccountAddress[];
}

export interface ThreadIdProps {
  address: AccountAddress;
  type?: string;
}

export class ThreadId {
  readonly address!: AccountAddress;
  readonly type?: string;

  constructor({ address, type }: ThreadIdProps) {
    this.address = address;
    this.type = type;
  }

  public equals(other: ThreadId): boolean {
    return this.address == other.address && this.type === other.type;
  }

  public toString(): string {
    return this.type
      ? this.type.toString() + ':' + this.address.toString()
      : this.address.toString();
  }
}

export interface Thread {
  id: ThreadId;
  me: ThreadMember;
  otherMembers: ThreadMember[];
  encryptionEnabled: boolean;
  canBeDecrypted: boolean;
  type: string;
  updatedAt: Date;
  lastMessage: ThreadMessage | null;

  messages(): Promise<ThreadMessage[]>;

  send(command: SendMessageCommand): Promise<void>;

  delete(): Promise<void>;

  markAsRead(): Promise<void>;
}

export interface ThreadMember {
  address: AccountAddress;
  scopes: ThreadMemberScope[];
  // lastReadMessageTimestamp: Date;
}

export enum ThreadMemberScope {
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}
