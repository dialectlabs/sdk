import type { PublicKey } from '@solana/web3.js';
import type { Backend } from 'sdk/sdk.interface';

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
  publicKey: PublicKey;
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
  otherMembers: PublicKey[];
}

export interface FindThreadSummaryByMembers {
  me: PublicKey;
  otherMembers: PublicKey[];
}

export interface ThreadIdProps {
  address: PublicKey;
  backend?: Backend;
}

export class ThreadId {
  readonly address!: PublicKey;
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
  publicKey: PublicKey;
  scopes: ThreadMemberScope[];
  // lastReadMessageTimestamp: Date;
}

export enum ThreadMemberScope {
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}
