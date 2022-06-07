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
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';
import {
  AccountAlreadyExistsError,
  AccountNotFoundError,
  SolanaError,
  withErrorParsing,
} from '@messaging/internal/solana-messaging-errors';
import { ThreadAlreadyExistsError } from '@messaging/internal/messaging-errors';
import { IllegalStateError } from '@sdk/errors';
import type {
  DiffeHellmanKeys,
  EncryptionKeysProvider,
} from '@encryption/encryption-keys-provider';
import { DialectWalletAdapterEncryptionKeysProvider } from '@encryption/encryption-keys-provider';
import { MessagingBackend } from '@sdk/sdk.interface';

export class SolanaMessaging implements Messaging {
  static create(walletAdapter: DialectWalletAdapterWrapper, program: Program) {
    const encryptionKeysProvider =
      new DialectWalletAdapterEncryptionKeysProvider(walletAdapter);
    return new SolanaMessaging(walletAdapter, program, encryptionKeysProvider);
  }

  constructor(
    private readonly walletAdapter: DialectWalletAdapterWrapper,
    private readonly program: Program,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
  ) {}

  async create(command: CreateDialectCommand): Promise<Thread> {
    const dialectAccount = await this.createInternal(command);
    return toSolanaThread(
      dialectAccount,
      this.walletAdapter,
      this.encryptionKeysProvider,
      this.program,
    );
  }

  private async createInternal(command: CreateDialectCommand) {
    const encryptionKeys = command.encrypted
      ? await this.encryptionKeysProvider.getFailFast()
      : null;
    const encryptionProps = getEncryptionProps(
      this.walletAdapter.publicKey,
      encryptionKeys,
    );
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
          command.encrypted,
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
    const dialectAccount = await this.findInternal(query);
    return (
      dialectAccount &&
      toSolanaThread(
        dialectAccount,
        this.walletAdapter,
        this.encryptionKeysProvider,
        this.program,
      )
    );
  }

  private async findInternal(query: FindDialectQuery) {
    const encryptionKeys = await this.encryptionKeysProvider.getFailSafe();
    const encryptionProps = getEncryptionProps(
      this.walletAdapter.publicKey,
      encryptionKeys,
    );
    try {
      if ('address' in query) {
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
    encryptionProps: EncryptionProps | null,
  ) {
    return withErrorParsing(
      getDialect(this.program, query.address, encryptionProps),
    );
  }

  private async findByOtherMember(
    query: FindDialectByOtherMemberQuery,
    encryptionProps: EncryptionProps | null,
  ) {
    return withErrorParsing(
      getDialectForMembers(
        this.program,
        [this.walletAdapter.publicKey, query.otherMember],
        encryptionProps,
      ),
    );
  }

  async findAll(): Promise<Thread[]> {
    const dialects = await findDialects(this.program, {
      userPk: this.walletAdapter.publicKey,
    });
    return Promise.all(
      dialects.map(async (it) =>
        toSolanaThread(
          it,
          this.walletAdapter,
          this.encryptionKeysProvider,
          this.program,
        ),
      ),
    );
  }
}

export class SolanaThread implements Thread {
  readonly backend: MessagingBackend = MessagingBackend.Solana;

  constructor(
    readonly address: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    private readonly program: Program,
    private readonly walletAdapter: DialectWalletAdapterWrapper,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
    private dialectAccount: DialectAccount,
  ) {}

  async delete(): Promise<void> {
    await deleteDialect(this.program, this.dialectAccount, this.walletAdapter);
  }

  async messages(): Promise<Message[]> {
    const encryptionKeys = await this.encryptionKeysProvider.getFailSafe();
    const encryptionProps = getEncryptionProps(
      this.me.publicKey,
      encryptionKeys,
    );
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
    const encryptionKeys = await this.encryptionKeysProvider.getFailFast();
    const encryptionProps = getEncryptionProps(
      this.me.publicKey,
      encryptionKeys,
    );
    await sendMessage(
      this.program,
      this.dialectAccount,
      this.walletAdapter,
      command.text,
      encryptionProps,
    );
  }

  get updatedAt() {
    return new Date(this.dialectAccount.dialect.lastMessageTimestamp);
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
  return dialect.members.find((it) => it.publicKey.equals(memberPk)) ?? null;
}

function findOtherMember(memberPk: PublicKey, dialect: Dialect) {
  return dialect.members.find((it) => !it.publicKey.equals(memberPk)) ?? null;
}

function getEncryptionProps(
  me: PublicKey,
  encryptionKeys: DiffeHellmanKeys | null,
) {
  return (
    encryptionKeys && {
      ed25519PublicKey: me.toBytes(),
      diffieHellmanKeyPair: encryptionKeys,
    }
  );
}

async function toSolanaThread(
  dialectAccount: DialectAccount,
  walletAdapter: DialectWalletAdapterWrapper,
  encryptionKeysProvider: EncryptionKeysProvider,
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
  const canBeDecrypted = dialect.encrypted
    ? (await encryptionKeysProvider.getFailSafe()) !== null
    : true;
  return new SolanaThread(
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
    canBeDecrypted,
    program,
    walletAdapter,
    encryptionKeysProvider,
    dialectAccount,
  );
}
