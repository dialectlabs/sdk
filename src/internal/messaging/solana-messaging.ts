import {
  CreateThreadCommand,
  FindThreadByIdQuery,
  FindThreadByOtherMemberQuery,
  FindThreadQuery,
  Messaging,
  SendMessageCommand,
  Thread,
  ThreadId,
  ThreadMember,
  ThreadMemberScope,
  ThreadMessage,
  ThreadsGeneralSummary,
  ThreadSummary,
} from '@messaging/messaging.interface';
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
  withErrorParsing,
} from '@messaging/internal/solana-messaging-errors';
import {
  IllegalStateError,
  SolanaError,
  ThreadAlreadyExistsError,
} from '@sdk/errors';
import { Backend } from '@sdk/sdk.interface';
import { requireSingleMember } from '@messaging/internal/commons';
import {
  DialectWalletAdapterEncryptionKeysProvider,
  EncryptionKeysProvider,
} from '@encryption/internal/encryption-keys-provider';
import type { DiffeHellmanKeys } from '@encryption/encryption.interface';

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

  async create(command: CreateThreadCommand): Promise<Thread> {
    const dialectAccount = await this.createInternal(command);
    const solanaThread = await toSolanaThread(
      dialectAccount,
      this.walletAdapter,
      this.encryptionKeysProvider,
      this.program,
    );
    if (!solanaThread) {
      throw new IllegalStateError(
        `Should not happen: cannot determine members in created thread.`,
      );
    }
    return solanaThread;
  }

  private async createInternal(command: CreateThreadCommand) {
    const otherMember = requireSingleMember(command.otherMembers);
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
              publicKey: otherMember.publicKey,
              scopes: toProtocolScopes(otherMember.scopes),
            },
          ],
          command.encrypted,
          await getEncryptionPropsForMutation(
            command.encrypted,
            this.encryptionKeysProvider,
            this.walletAdapter,
          ),
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

  async find(query: FindThreadQuery): Promise<Thread | null> {
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

  private async findInternal(query: FindThreadQuery) {
    const encryptionKeys = await this.encryptionKeysProvider.getFailSafe();
    const encryptionProps = getEncryptionProps(
      this.walletAdapter.publicKey,
      encryptionKeys,
    );
    try {
      if ('id' in query) {
        return await this.findById(query, encryptionProps);
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

  private async findById(
    query: FindThreadByIdQuery,
    encryptionProps: EncryptionProps | null,
  ) {
    return withErrorParsing(
      getDialect(this.program, query.id.address, encryptionProps),
    );
  }

  private async findByOtherMember(
    query: FindThreadByOtherMemberQuery,
    encryptionProps: EncryptionProps | null,
  ) {
    const otherMember = requireSingleMember(query.otherMembers);
    return withErrorParsing(
      getDialectForMembers(
        this.program,
        [this.walletAdapter.publicKey, otherMember],
        encryptionProps,
      ),
    );
  }

  async findAll(): Promise<Thread[]> {
    const dialects = await withErrorParsing(
      findDialects(this.program, {
        userPk: this.walletAdapter.publicKey,
      }),
    );
    const all = await Promise.all(
      dialects.map(async (it) =>
        toSolanaThread(
          it,
          this.walletAdapter,
          this.encryptionKeysProvider,
          this.program,
        ),
      ),
    );
    return all.filter((it) => Boolean(it)).map((it) => it!);
  }

  async findSummary(
    query: FindThreadByOtherMemberQuery,
  ): Promise<ThreadSummary | null> {
    return null;
  }

  async findSummaryAll(): Promise<ThreadsGeneralSummary | null> {
    return null;
  }
}

export class SolanaThread implements Thread {
  readonly backend: Backend = Backend.Solana;
  readonly id: ThreadId;

  constructor(
    address: PublicKey,
    readonly me: ThreadMember,
    readonly otherMembers: ThreadMember[],
    readonly otherMember: ThreadMember,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    private readonly program: Program,
    private readonly walletAdapter: DialectWalletAdapterWrapper,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
    private dialectAccount: DialectAccount,
  ) {
    this.id = new ThreadId({
      backend: this.backend,
      address,
    });
  }

  async delete(): Promise<void> {
    await withErrorParsing(
      deleteDialect(this.program, this.dialectAccount, this.walletAdapter),
    );
  }

  async messages(): Promise<ThreadMessage[]> {
    const encryptionKeys = await this.encryptionKeysProvider.getFailSafe();
    const encryptionProps = getEncryptionProps(
      this.me.publicKey,
      encryptionKeys,
    );
    this.dialectAccount = await withErrorParsing(
      getDialect(this.program, this.dialectAccount.publicKey, encryptionProps),
    );
    return this.dialectAccount.dialect.messages.map((it) => ({
      author: it.owner.equals(this.me.publicKey) ? this.me : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: it.text,
    }));
  }

  async send(command: SendMessageCommand): Promise<void> {
    const encryptionProps = await getEncryptionPropsForMutation(
      this.encryptionEnabled,
      this.encryptionKeysProvider,
      this.walletAdapter,
    );
    await withErrorParsing(
      sendMessage(
        this.program,
        this.dialectAccount,
        this.walletAdapter,
        command.text,
        encryptionProps,
      ),
    );
  }

  get updatedAt() {
    return new Date(this.dialectAccount.dialect.lastMessageTimestamp);
  }

  setLastReadMessageTime(time: Date): Promise<void> {
    return Promise.resolve(undefined);
  }
}

function fromProtocolScopes(scopes: [boolean, boolean]) {
  return [
    ...(scopes[0] ? [ThreadMemberScope.ADMIN] : []),
    ...(scopes[1] ? [ThreadMemberScope.WRITE] : []),
  ];
}

function toProtocolScopes(scopes: ThreadMemberScope[]): [boolean, boolean] {
  return [
    scopes.some((it) => it === ThreadMemberScope.ADMIN),
    scopes.some((it) => it === ThreadMemberScope.WRITE),
  ];
}

function findMember(memberPk: PublicKey, dialect: Dialect) {
  return dialect.members.find((it) => it.publicKey.equals(memberPk)) ?? null;
}

function findOtherMember(memberPk: PublicKey, dialect: Dialect) {
  return dialect.members.find((it) => !it.publicKey.equals(memberPk)) ?? null;
}

async function toSolanaThread(
  dialectAccount: DialectAccount,
  walletAdapter: DialectWalletAdapterWrapper,
  encryptionKeysProvider: EncryptionKeysProvider,
  program: Program,
): Promise<SolanaThread | null> {
  const { dialect, publicKey } = dialectAccount;
  const meMember = findMember(walletAdapter.publicKey, dialect);
  const otherMember = findOtherMember(walletAdapter.publicKey, dialect);
  if (!meMember || !otherMember) {
    return null;
  }
  const canBeDecrypted = dialect.encrypted
    ? (await encryptionKeysProvider.getFailSafe()) !== null
    : true;
  const otherThreadMember: ThreadMember = {
    publicKey: otherMember.publicKey,
    scopes: fromProtocolScopes(otherMember.scopes),
    // lastReadMessageTimestamp: new Date(), // TODO: implement
  };
  return new SolanaThread(
    publicKey,
    {
      publicKey: meMember.publicKey,
      scopes: fromProtocolScopes(meMember.scopes),
      // lastReadMessageTimestamp: new Date(), // TODO: implement
    },
    [otherThreadMember],
    otherThreadMember,
    dialect.encrypted,
    canBeDecrypted,
    program,
    walletAdapter,
    encryptionKeysProvider,
    dialectAccount,
  );
}

async function getEncryptionPropsForMutation(
  isThreadEncrypted: boolean,
  encryptionKeysProvider: EncryptionKeysProvider,
  walletAdapter: DialectWalletAdapterWrapper,
) {
  const encryptionKeys = isThreadEncrypted
    ? await encryptionKeysProvider.getFailFast()
    : null;
  return getEncryptionProps(walletAdapter.publicKey, encryptionKeys);
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
