import type {
  CreateDialectCommand,
  DialectMember,
  FindDialectByAddressQuery,
  FindDialectByOtherMemberQuery,
  FindDialectQuery,
  Message,
  Messaging,
  SendMessageCommand,
  Thread,
} from '@messaging/messaging.interface';
import { DialectMemberScope } from '@messaging/messaging.interface';
import type { PublicKey } from '@solana/web3.js';
import {
  createDialect,
  deleteDialect,
  Dialect,
  DialectAccount,
  EncryptionProps,
  findDialects,
  getDialect,
  getDialectForMembers,
  sendMessage,
} from '@dialectlabs/web3';

import type { Program } from '@project-serum/anchor';
import { getEncryptionProps } from './messaging-common';
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/internal/dialect-wallet-adapter-wrapper';
import {
  AccountAlreadyExistsError,
  AccountNotFoundError,
  SolanaError,
  withErrorParsing,
} from '@messaging/internal/solana-messaging-errors';
import { ThreadAlreadyExistsError } from '@messaging/internal/messaging-errors';
import { IllegalStateError } from '@sdk/errors';

export class SolanaMessaging implements Messaging {
  constructor(
    private readonly walletAdapter: DialectWalletAdapterWrapper,
    private readonly program: Program,
  ) {}

  async create(command: CreateDialectCommand): Promise<Thread> {
    const encrypted = command.encrypted;
    const encryptionProps = await getEncryptionProps(
      command.encrypted,
      this.walletAdapter,
    );
    // TODO: same as for web2! accurate handling of dh absence: extract adapter interface + handle sollet
    const dialectAccount = await this.createInternal(
      command,
      encrypted,
      encryptionProps,
    );
    return toWeb3Dialect(dialectAccount, this.walletAdapter, this.program);
  }

  private async createInternal(
    command: CreateDialectCommand,
    encrypted: boolean,
    encryptionProps?: EncryptionProps,
  ) {
    try {
      return await withErrorParsing(
        createDialect(
          this.program,
          this.walletAdapter,
          [
            {
              publicKey: this.walletAdapter.publicKey,
              scopes: toProtocolScopes(command.me.scopes),
            },
            {
              publicKey: command.otherMember.publicKey,
              scopes: toProtocolScopes(command.otherMember.scopes),
            },
          ],
          encrypted,
          encryptionProps,
        ),
      );
    } catch (e) {
      const err = e as SolanaError;
      if (err.type === AccountAlreadyExistsError.name) {
        throw new ThreadAlreadyExistsError();
      }
      throw e;
    }
  }

  async find(query: FindDialectQuery): Promise<Thread | null> {
    const encryptionProps = await getEncryptionProps(true, this.walletAdapter);
    const dialectAccount = await this.findInternal(query, encryptionProps);
    return (
      dialectAccount &&
      toWeb3Dialect(dialectAccount, this.walletAdapter, this.program)
    );
  }

  private async findInternal(
    query: FindDialectQuery,
    encryptionProps?: EncryptionProps,
  ) {
    try {
      if ('publicKey' in query) {
        return await this.findByAddress(query, encryptionProps);
      }
      return await this.findByOtherMember(query, encryptionProps);
    } catch (e) {
      const err = e as SolanaError;
      if (err.type === AccountNotFoundError.name) {
        return null;
      }
      throw e;
    }
  }

  private async findByAddress(
    query: FindDialectByAddressQuery,
    encryptionProps?: EncryptionProps,
  ) {
    return withErrorParsing(
      getDialect(this.program, query.publicKey, encryptionProps),
    );
  }

  private findByOtherMember = (
    query: FindDialectByOtherMemberQuery,
    encryptionProps?: EncryptionProps,
  ) =>
    withErrorParsing(
      getDialectForMembers(
        this.program,
        [this.walletAdapter.publicKey, query.otherMember],
        encryptionProps,
      ),
    );

  async findAll(): Promise<Thread[]> {
    // TODO: rn we have different behavior for web3 and web2 versions: this one always returns empty msgs
    // TODO: why we don't pass encryptionProps here in protocol?
    const dialects = await findDialects(this.program, {
      userPk: this.walletAdapter.publicKey,
    });
    return dialects.map((it) =>
      toWeb3Dialect(it, this.walletAdapter, this.program),
    );
  }
}

export class SolanaThread implements Thread {
  constructor(
    readonly walletAdapter: DialectWalletAdapterWrapper,
    readonly program: Program,
    readonly publicKey: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encrypted: boolean,
    private dialectAccount: DialectAccount,
  ) {}

  async delete(): Promise<void> {
    await deleteDialect(this.program, this.dialectAccount, this.walletAdapter);
  }

  async messages(): Promise<Message[]> {
    const encryptionProps = await getEncryptionProps(true, this.walletAdapter);
    this.dialectAccount = await getDialect(
      this.program,
      this.dialectAccount.publicKey,
      encryptionProps,
    );
    return this.dialectAccount.dialect.messages.map((it) => ({
      author: it.owner.equals(this.me.publicKey) ? this.me : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: it.text,
    }));
  }

  async send(command: SendMessageCommand): Promise<void> {
    const encryptionProps = await getEncryptionProps(
      this.encrypted,
      this.walletAdapter,
    );
    await sendMessage(
      this.program,
      this.dialectAccount,
      this.walletAdapter,
      command.text,
      encryptionProps,
    );
  }
}

function fromProtocolScopes(scopes: [boolean, boolean]) {
  return [
    ...(scopes[0] ? [DialectMemberScope.ADMIN] : []),
    ...(scopes[1] ? [DialectMemberScope.WRITE] : []),
  ];
}

function toProtocolScopes(scopes: DialectMemberScope[]): [boolean, boolean] {
  return [
    scopes.some((it) => it === DialectMemberScope.ADMIN),
    scopes.some((it) => it === DialectMemberScope.WRITE),
  ];
}

function findMember(memberPk: PublicKey, dialect: Dialect) {
  return dialect.members.find((it) => it.publicKey.equals(memberPk));
}

function findOtherMember(memberPk: PublicKey, dialect: Dialect) {
  return dialect.members.find((it) => !it.publicKey.equals(memberPk));
}

function toWeb3Dialect(
  dialectAccount: DialectAccount,
  walletAdapter: DialectWalletAdapterWrapper,
  program: Program,
) {
  const { dialect, publicKey } = dialectAccount;
  const meMember = findMember(walletAdapter.publicKey, dialect);
  const otherMember = findOtherMember(walletAdapter.publicKey, dialect);
  if (!meMember || !otherMember) {
    throw new IllegalStateError(
      `Cannot resolve members from given list: ${dialect.members.map((it) =>
        it.publicKey.toBase58(),
      )} and wallet public key ${walletAdapter.publicKey.toBase58()}`,
    );
  }
  return new SolanaThread(
    walletAdapter,
    program,
    publicKey,
    {
      publicKey: meMember.publicKey,
      scopes: fromProtocolScopes(meMember.scopes),
    },
    {
      publicKey: otherMember.publicKey,
      scopes: fromProtocolScopes(otherMember.scopes),
    },
    dialect.encrypted,
    dialectAccount,
  );
}
