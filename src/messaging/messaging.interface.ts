import type { PublicKey } from '@solana/web3.js';
import type { Backend } from '@sdk/sdk.interface';

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
    return JSON.stringify(this);
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
