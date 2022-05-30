import type { EncryptionProps } from '@dialectlabs/web3';
import type { PublicKey } from '@solana/web3.js';
import type { DialectWalletAdapterDecorator } from '../../internal/dialect-wallet-adapter';

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

export async function getEncryptionProps(
  encrypted: boolean,
  walletAdapter: DialectWalletAdapterDecorator,
): Promise<EncryptionProps | undefined> {
  if (encrypted && walletAdapter.canEncrypt()) {
    return {
      diffieHellmanKeyPair: await walletAdapter.diffieHellman(),
      ed25519PublicKey: walletAdapter.publicKey.toBytes(),
    };
  }
}
