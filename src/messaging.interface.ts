import type { PublicKey } from '@solana/web3.js';

export interface Messaging {
  findAll(): Promise<Dialect[]>;

  create(command: CreateDialectCommand): Promise<Dialect>;

  find(query: FindDialectQuery): Promise<Dialect | null>;
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

export interface FindDialectQuery {
  publicKey: PublicKey;
}

export interface Dialect {
  publicKey: PublicKey;
  me: DialectMember;
  otherMember: DialectMember;
  encrypted: boolean;

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
