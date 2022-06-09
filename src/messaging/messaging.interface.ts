import type { PublicKey } from '@solana/web3.js';
import type { MessagingBackend } from '@sdk/sdk.interface';

export interface Messaging {
  findAll(): Promise<Thread[]>;

  create(command: CreateThreadCommand): Promise<Thread>;

  find(query: FindThreadQuery): Promise<Thread | null>;
}

export interface SendMessageCommand {
  text: string;
}

export interface Message {
  text: string;
  timestamp: Date;
  author: ThreadMember;
}

export interface CreateThreadCommand {
  me: Omit<ThreadMember, 'publicKey'>;
  otherMembers: ThreadMember[];
  encrypted: boolean;
}

export type FindThreadQuery =
  | FindThreadByAddressQuery
  | FindThreadByOtherMemberQuery;

export interface FindThreadByAddressQuery {
  address: PublicKey;
}

export interface FindThreadByOtherMemberQuery {
  otherMembers: PublicKey[];
}

export interface Thread {
  address: PublicKey;
  me: ThreadMember;
  otherMembers: ThreadMember[];
  encryptionEnabled: boolean;
  canBeDecrypted: boolean;
  backend: MessagingBackend;
  updatedAt: Date;

  messages(): Promise<Message[]>;

  send(command: SendMessageCommand): Promise<void>;

  delete(): Promise<void>;
}

export interface ThreadMember {
  publicKey: PublicKey;
  scopes: ThreadMemberScope[];
}

export enum ThreadMemberScope {
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}
