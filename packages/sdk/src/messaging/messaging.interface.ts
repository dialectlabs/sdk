import type { AccountAddress } from '../auth/auth.interface';

export interface Messaging {
  type: string;

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
  address: AccountAddress;
  hasUnreadMessages: boolean;
  unreadMessagesCount: number;
}

export interface SendMessageCommand {
  text: string;
  deduplicationId?: string;
}

export interface MessageAction {
  label: string;
  url: string;
}

export interface MessageMetadata {
  title?: string;
  // tags?: string[];
  actions?: MessageAction[];
  notificationTypeId?: string;
  notificationTypeHumanReadableId?: string;
}

export interface ThreadMessage {
  text: string;
  timestamp: Date;
  author: ThreadMember;
  metadata?: MessageMetadata;
  deduplicationId?: string;
}

export interface CreateThreadCommand {
  me: Omit<ThreadMember, 'address' | 'lastReadMessageTimestamp'>;
  otherMembers: Omit<ThreadMember, 'lastReadMessageTimestamp'>[];
  encrypted: boolean;
  type?: string;
}

export interface AddMembersCommand {
  members: Omit<ThreadMember, 'lastReadMessageTimestamp'>[];
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
  name?: string;

  messages(): Promise<ThreadMessage[]>;

  send(command: SendMessageCommand): Promise<void>;

  delete(): Promise<void>;

  markAsRead(): Promise<void>;

  addMembers(command: AddMembersCommand): Promise<void>;

  removeMember(address: AccountAddress): Promise<void>;

  rename(name: string): Promise<void>;
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
