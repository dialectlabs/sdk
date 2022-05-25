import type { PublicKey } from '@solana/web3.js';

export interface Messaging {
  list(): Promise<Dialect[]>;

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
  enableEncryption: boolean;
}

export interface FindDialectQuery {
  address: PublicKey;
}

export interface Dialect {
  address: PublicKey;
  me: DialectMember;
  otherMember: DialectMember;
  encryptionEnabled: boolean;

  messages(): Promise<Message[]>;

  send(command: SendMessageCommand): Promise<void>;

  delete(): Promise<void>;
}

export interface DialectMember {
  publicKey: PublicKey;
  roles: DialectMemberRole[];
}

export enum DialectMemberRole {
  Writer = 'WRITER',
  Owner = 'OWNER',
}
