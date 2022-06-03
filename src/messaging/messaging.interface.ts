import type { PublicKey } from '@solana/web3.js';

export interface Messaging {
  findAll(): Promise<Thread[]>;

  create(command: CreateDialectCommand): Promise<Thread>;

  find(query: FindDialectQuery): Promise<Thread | null>;
}

export interface SendMessageCommand {
  text: string;
}

export interface Message {
  text: string;
  timestamp: Date;
  author: DialectMember;
}

export interface CreateDialectCommand {
  me: Omit<DialectMember, 'publicKey'>;
  otherMember: DialectMember;
  encrypted: boolean;
}

export type FindDialectQuery =
  | FindDialectByAddressQuery
  | FindDialectByOtherMemberQuery;

export interface FindDialectByAddressQuery {
  address: PublicKey;
}

export interface FindDialectByOtherMemberQuery {
  otherMember: PublicKey;
}

export interface Thread {
  address: PublicKey;
  me: DialectMember;
  otherMember: DialectMember;
  encryptionEnabled: boolean;
  canBeDecrypted: boolean;

  messages(): Promise<Message[]>;

  send(command: SendMessageCommand): Promise<void>;

  delete(): Promise<void>;
}

export interface DialectMember {
  publicKey: PublicKey;
  scopes: DialectMemberScope[];
}

export enum DialectMemberScope {
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}
