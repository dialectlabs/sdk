import type {
  CreateThreadCommand,
  FindThreadByIdQuery,
  FindThreadByOtherMemberQuery,
  FindThreadQuery,
  Messaging,
  SendMessageCommand,
  Thread,
  ThreadMember,
  ThreadMemberSummary,
  ThreadMessage,
  ThreadsGeneralSummary,
  ThreadSummary,
} from '../../core/messaging/messaging.interface';
import type {
  DataServiceDialectsApi,
  DialectAccountDto,
  DialectDto,
} from '../../data-service-api/data-service-dialects-api';
import { requireSingleMember } from './commons';
import type { DataServiceApiClientError } from '../../data-service-api/data-service-api';
import {
  IllegalStateError,
  ResourceNotFoundError,
  ThreadAlreadyExistsError,
} from '../../core/sdk/errors';
import type { EncryptionKeysProvider } from '../../core/internal/encryption/encryption-keys-provider';
import { MemberScopeDto } from '../../data-service-api/data-service-dialects-api';
import {
  ThreadId,
  ThreadMemberScope,
} from '../../core/messaging/messaging.interface';
import {
  EncryptedTextSerde,
  EncryptionProps,
  TextSerde,
  UnencryptedTextSerde,
} from '@dialectlabs/web3';
import { PublicKey } from '@solana/web3.js';
import { Backend } from '../../core/sdk/sdk.interface';
import { withErrorParsing } from '../../data-service-api/data-service-errors';

export class DataServiceMessaging implements Messaging {
  constructor(
    private readonly me: PublicKey,
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
  ) {}

  async create(command: CreateThreadCommand): Promise<Thread> {
    const otherMembers = requireAtLeastOneMember(command.otherMembers);
    if (command.encrypted && otherMembers.length >= 2) {
      throw new UnsupportedOperationError(
        'Unsupported operation',
        'Encryption not supported in group chats',
      );
    }
    command.encrypted && (await this.checkEncryptionSupported());
    const dialectAccountDto = await withErrorParsing(
      this.dataServiceDialectsApi.create({
        encrypted: command.encrypted,
        members: [
          {
            publicKey: this.me.toBase58(),
            scopes: toDataServiceScopes(command.me.scopes),
          },
          ...otherMembers.map((e) => ({
            publicKey: e.publicKey.toBase58(),
            scopes: toDataServiceScopes(e.scopes),
          })),
        ],
      }),
      () => new ThreadAlreadyExistsError(),
    );
    return this.toDataServiceThread(dialectAccountDto);
  }

  async find(query: FindThreadQuery): Promise<Thread | null> {
    const dialectAccountDto = await this.findInternal(query);
    return dialectAccountDto && this.toDataServiceThread(dialectAccountDto);
  }

  async findAll(): Promise<Thread[]> {
    const dialectAccountDtos = await withErrorParsing(
      this.dataServiceDialectsApi.findAll(),
    );
    return Promise.all(
      dialectAccountDtos.map((it) => this.toDataServiceThread(it)),
    );
  }

  private checkEncryptionSupported() {
    return this.encryptionKeysProvider.getFailFast();
  }

  private async toDataServiceThread(dialectAccountDto: DialectAccountDto) {
    const { publicKey, dialect } = dialectAccountDto;
    const meMember = findMember(this.me, dialect);
    const otherMembers = findOtherMembers(this.me, dialect);
    if (!meMember || !otherMembers.length) {
      throw new IllegalStateError(
        `Cannot resolve members from given list: ${dialect.members.map(
          (it) => it.publicKey,
        )} and wallet public key ${this.me.toBase58()}`,
      );
    }
    const { serde, canBeDecrypted } = await this.createTextSerde(dialect);
    const otherThreadMembers: ThreadMember[] = otherMembers.map((member) => ({
      publicKey: new PublicKey(member.publicKey),
      scopes: fromDataServiceScopes(member.scopes),
      // lastReadMessageTimestamp: new Date(), // TODO: implement
    }));
    const otherMembersPks = Object.fromEntries(
      otherThreadMembers.map((member) => [member.publicKey.toBase58(), member]),
    );
    
    let thisThreadMember = {
      publicKey: new PublicKey(meMember.publicKey),
      scopes: fromDataServiceScopes(meMember.scopes),
      // lastReadMessageTimestamp: new Date(), // TODO: implement
    };
    let lastMessage = dialect.messages[0] ?? null;
    let lastThreadMessage: ThreadMessage | null = null;
    if (lastMessage != null) {
      lastThreadMessage = {
        text: serde.deserialize(new Uint8Array(lastMessage.text)),
        timestamp: new Date(lastMessage.timestamp),
        author: lastMessage.owner === this.me.toBase58()
          ? thisThreadMember
          : otherMembersPks[lastMessage.owner]!,
        deduplicationId: lastMessage.deduplicationId ,
      }
    };
    return new DataServiceThread(
      this.dataServiceDialectsApi,
      serde,
      this.encryptionKeysProvider,
      new PublicKey(publicKey),
      thisThreadMember,
      otherThreadMembers,
      otherMembersPks,
      dialect.encrypted,
      canBeDecrypted,
      new Date(dialect.lastMessageTimestamp),
      lastThreadMessage,
    );
  }

  private async createTextSerde(dialect: DialectDto): Promise<{
    serde: TextSerde;
    canBeDecrypted: boolean;
  }> {
    if (!dialect.encrypted) {
      return {
        serde: new UnencryptedTextSerde(),
        canBeDecrypted: true,
      };
    }
    const diffieHellmanKeyPair =
      await this.encryptionKeysProvider.getFailSafe();
    const encryptionProps: EncryptionProps | null = diffieHellmanKeyPair && {
      diffieHellmanKeyPair,
      ed25519PublicKey: this.me.toBytes(),
    };
    if (!encryptionProps) {
      return {
        serde: new UnencryptedTextSerde(),
        canBeDecrypted: false,
      };
    }
    return {
      serde: new EncryptedTextSerde(
        encryptionProps,
        dialect.members.map((it) => new PublicKey(it.publicKey)),
      ),
      canBeDecrypted: true,
    };
  }

  private findInternal(
    query: FindThreadByIdQuery | FindThreadByOtherMemberQuery,
  ) {
    if ('id' in query) {
      return this.findById(query);
    }
    return this.findByOtherMember(query);
  }

  private async findById(query: FindThreadByIdQuery) {
    try {
      return await withErrorParsing(
        this.dataServiceDialectsApi.find(query.id.address.toBase58()),
      );
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  private async findByOtherMember(query: FindThreadByOtherMemberQuery) {
    const otherMembers = requireAtLeastOneMember(query.otherMembers);
    const dialectAccountDtos = await withErrorParsing(
      this.dataServiceDialectsApi.findAll({
        memberPublicKeys: otherMembers.map((member) => member.toBase58()),
      }),
    );
    if (dialectAccountDtos.length > 1) {
      throw new IllegalStateError('Found multiple dialects with same members');
    }
    return dialectAccountDtos[0] ?? null;
  }

  async findSummary(
    query: FindThreadByOtherMemberQuery,
  ): Promise<ThreadSummary | null> {
    try {
      const dialectSummaryDto = await withErrorParsing(
        this.dataServiceDialectsApi.findSummary({
          memberPublicKeys: [
            this.me.toBase58(),
            ...query.otherMembers.map((it) => it.toBase58()),
          ],
        }),
      );
      const meMember = dialectSummaryDto.memberSummaries.find(
        (it) => it.publicKey === this.me.toBase58(),
      );
      if (!meMember) {
        throw new IllegalStateError(
          `Cannot resolve member from given list: ${dialectSummaryDto.memberSummaries.map(
            (it) => it.publicKey,
          )} and provided member public key ${this.me.toBase58()}`,
        );
      }
      const meMemberSummary: ThreadMemberSummary = {
        publicKey: new PublicKey(meMember.publicKey),
        hasUnreadMessages: meMember.hasUnreadMessages,
        unreadMessagesCount: meMember.unreadMessagesCount,
      };
      return {
        id: new ThreadId({
          address: new PublicKey(dialectSummaryDto.publicKey),
          backend: Backend.DialectCloud,
        }),
        me: meMemberSummary,
      };
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  async findSummaryAll(): Promise<ThreadsGeneralSummary> {
    return await withErrorParsing(
      this.dataServiceDialectsApi.findSummaryAll({
        publicKey: this.me.toBase58(),
      }),
    );
  }
}

export class DataServiceThread implements Thread {
  readonly backend: Backend = Backend.DialectCloud;
  readonly id: ThreadId;

  constructor(
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly textSerde: TextSerde,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
    private readonly address: PublicKey,
    readonly me: ThreadMember,
    readonly otherMembers: ThreadMember[],
    private readonly otherMembersPks: Record<string, ThreadMember>,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    public updatedAt: Date,
    public lastMessage: ThreadMessage | null,
  ) {
    this.id = new ThreadId({
      backend: this.backend,
      address,
    });
  }

  async delete(): Promise<void> {
    await withErrorParsing(
      this.dataServiceDialectsApi.delete(this.address.toBase58()),
    );
  }

  async messages(): Promise<ThreadMessage[]> {
    const { dialect } = await withErrorParsing(
      this.dataServiceDialectsApi.find(this.address.toBase58()),
    );
    this.updatedAt = new Date(dialect.lastMessageTimestamp);
    if (this.encryptionEnabledButCannotBeUsed()) {
      return [];
    }
    return dialect.messages.map((it) => ({
      author:
        it.owner === this.me.publicKey.toBase58()
          ? this.me
          : this.otherMembersPks[it.owner]!,
      timestamp: new Date(it.timestamp),
      text: this.textSerde.deserialize(new Uint8Array(it.text)),
      deduplicationId: it.deduplicationId,
    }));
  }

  private encryptionEnabledButCannotBeUsed() {
    return this.encryptionEnabled && !this.canBeDecrypted;
  }

  async send(command: SendMessageCommand): Promise<void> {
    if (this.encryptionEnabledButCannotBeUsed()) {
      await this.encryptionKeysProvider.getFailFast();
    }
    await withErrorParsing(
      this.dataServiceDialectsApi.sendMessage(this.address.toBase58(), {
        text: Array.from(this.textSerde.serialize(command.text)),
        deduplicationId: command.deduplicationId,
      }),
    );
  }

  async setLastReadMessageTime(time: Date): Promise<void> {
    await withErrorParsing(
      this.dataServiceDialectsApi.patchMember(this.id.address.toBase58(), {
        lastReadMessageTimestamp: time.getTime(),
      }),
    );
  }
}

function fromDataServiceScopes(scopes: MemberScopeDto[]) {
  return scopes.map((it) => ThreadMemberScope[it]);
}

function toDataServiceScopes(scopes: ThreadMemberScope[]) {
  return scopes.map((it) => MemberScopeDto[it]);
}

function findMember(memberPk: PublicKey, dialect: DialectDto) {
  return (
    dialect.members.find((it) => memberPk.toBase58() === it.publicKey) ?? null
  );
}

function findOtherMembers(memberPk: PublicKey, dialect: DialectDto) {
  return dialect.members.filter((it) => memberPk.toBase58() !== it.publicKey);
}
