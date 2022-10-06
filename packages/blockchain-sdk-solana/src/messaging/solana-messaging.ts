import type {
  CreateThreadCommand,
  DiffeHellmanKeys,
  EncryptionKeysProvider,
  FindThreadByIdQuery,
  FindThreadByOtherMemberQuery,
  FindThreadQuery,
  Messaging,
  PublicKey,
  SendMessageCommand,
  Thread,
  ThreadMember,
  ThreadMessage,
  ThreadsGeneralSummary,
  ThreadSummary,
} from '@dialectlabs/sdk';
import {
  IllegalStateError,
  ThreadAlreadyExistsError,
  ThreadId,
  ThreadMemberScope,
} from '@dialectlabs/sdk';
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
import { requireSingleMember } from './commons';
import {
  AccountAlreadyExistsError,
  AccountNotFoundError,
  withErrorParsing,
} from './solana-messaging-errors';
import type { Program } from '@project-serum/anchor';
import { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import type { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type { SolanaError } from '../errors';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA } from '../sdk/constants';

export class SolanaMessaging implements Messaging {
  readonly type: string = DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA;

  constructor(
    private readonly walletAdapter: DialectSolanaWalletAdapterWrapper,
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
              publicKey: new SolanaPublicKey(otherMember.address.toString()),
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

  private async findInternal(query: FindThreadQuery) {
    const encryptionKeys = await this.encryptionKeysProvider.getFailSafe(
      this.walletAdapter.publicKey.toBase58(),
    );
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
      getDialect(
        this.program,
        new SolanaPublicKey(query.id.address),
        encryptionProps,
      ),
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
        [
          this.walletAdapter.publicKey,
          new SolanaPublicKey(otherMember.toString()),
        ],
        encryptionProps,
      ),
    );
  }
}

export class SolanaThread implements Thread {
  readonly type = DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA;
  readonly id: ThreadId;
  lastMessage: ThreadMessage | null;

  constructor(
    address: PublicKey,
    readonly me: ThreadMember,
    readonly otherMembers: ThreadMember[],
    readonly otherMember: ThreadMember,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    private readonly program: Program,
    private readonly walletAdapter: DialectSolanaWalletAdapterWrapper,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
    private dialectAccount: DialectAccount,
  ) {
    this.id = new ThreadId({
      type: this.type,
      address: address.toString(),
    });
    this.lastMessage = null;
  }

  get updatedAt() {
    return new Date(this.dialectAccount.dialect.lastMessageTimestamp);
  }

  async delete(): Promise<void> {
    await withErrorParsing(
      deleteDialect(this.program, this.dialectAccount, this.walletAdapter),
    );
  }

  async messages(): Promise<ThreadMessage[]> {
    const encryptionKeys = await this.encryptionKeysProvider.getFailSafe(
      this.walletAdapter.publicKey.toBase58(),
    );
    const encryptionProps = getEncryptionProps(
      new SolanaPublicKey(this.me.address),
      encryptionKeys,
    );
    this.dialectAccount = await withErrorParsing(
      getDialect(this.program, this.dialectAccount.publicKey, encryptionProps),
    );
    const threadMessages = this.dialectAccount.dialect.messages.map((it) => ({
      author: it.owner.equals(new SolanaPublicKey(this.me.address))
        ? this.me
        : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: it.text,
    }));
    this.lastMessage = threadMessages[0] || null;
    return threadMessages;
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

  markAsRead(): Promise<void> {
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
  return (
    dialect.members.find((it) =>
      it.publicKey.equals(new SolanaPublicKey(memberPk.toString())),
    ) ?? null
  );
}

function findOtherMember(memberPk: PublicKey, dialect: Dialect) {
  return (
    dialect.members.find(
      (it) => !it.publicKey.equals(new SolanaPublicKey(memberPk.toString())),
    ) ?? null
  );
}

async function toSolanaThread(
  dialectAccount: DialectAccount,
  walletAdapter: DialectSolanaWalletAdapterWrapper,
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
    ? (await encryptionKeysProvider.getFailSafe(
        walletAdapter.publicKey.toBase58(),
      )) !== null
    : true;
  const otherThreadMember: ThreadMember = {
    address: otherMember.publicKey.toBase58(),
    scopes: fromProtocolScopes(otherMember.scopes),
    // lastReadMessageTimestamp: new Date(), // TODO: implement
  };
  return new SolanaThread(
    publicKey,
    {
      address: meMember.publicKey.toBase58(),
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
  walletAdapter: DialectSolanaWalletAdapterWrapper,
) {
  const encryptionKeys = isThreadEncrypted
    ? await encryptionKeysProvider.getFailFast(
        walletAdapter.publicKey.toBase58(),
      )
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
