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
} from '../../messaging/messaging.interface';
import {
  ThreadId,
  ThreadMemberScope,
} from '../../messaging/messaging.interface';
import type {
  DataServiceDialectsApi,
  DialectAccountDto,
  DialectDto,
} from '../../../data-service-api/data-service-dialects-api';
import { MemberScopeDto } from '../../../data-service-api/data-service-dialects-api';
import type { DataServiceApiClientError } from '../../../data-service-api/data-service-api';
import {
  IllegalStateError,
  ResourceNotFoundError,
  UnsupportedOperationError,
} from '../../sdk/errors';
import type { EncryptionKeysProvider } from '../encryption/encryption-keys-provider';
import { withErrorParsing } from '../../../data-service-api/data-service-errors';
import { ThreadAlreadyExistsError } from '../../messaging/errors';
import type { AccountAddress } from '../../auth/auth.interface';
import { Ed25519PublicKey } from '../../auth/ed25519/ed25519-public-key';
import type { EncryptionProps, TextSerde } from '../../messaging/text-serde';
import {
  EncryptedTextSerde,
  UnencryptedTextSerde,
} from '../../messaging/text-serde';
import { requireAtLeastOneMember } from '../../messaging/commons';

export class DataServiceMessaging implements Messaging {
  readonly type = 'dialect-cloud';

  constructor(
    private readonly me: AccountAddress,
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
            publicKey: this.me,
            scopes: toDataServiceScopes(command.me.scopes),
          },
          ...otherMembers.map((e) => ({
            publicKey: e.address,
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

  async findSummary(
    query: FindThreadByOtherMemberQuery,
  ): Promise<ThreadSummary | null> {
    try {
      const dialectSummaryDto = await withErrorParsing(
        this.dataServiceDialectsApi.findSummary({
          memberPublicKeys: [
            this.me.toString(),
            ...query.otherMembers.map((it) => it.toString()),
          ],
        }),
      );
      const meMember = dialectSummaryDto.memberSummaries.find(
        (it) => it.publicKey === this.me,
      );
      if (!meMember) {
        throw new IllegalStateError(
          `Cannot resolve member from given list: ${dialectSummaryDto.memberSummaries.map(
            (it) => it.publicKey,
          )} and provided member public key ${this.me.toString()}`,
        );
      }
      const meMemberSummary: ThreadMemberSummary = {
        address: meMember.publicKey,
        hasUnreadMessages: meMember.hasUnreadMessages,
        unreadMessagesCount: meMember.unreadMessagesCount,
      };
      return {
        id: new ThreadId({
          address: dialectSummaryDto.publicKey,
          type: this.type,
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
        publicKey: this.me,
      }),
    );
  }

  private checkEncryptionSupported() {
    return this.encryptionKeysProvider.getFailFast(
      new Ed25519PublicKey(this.me),
    );
  }

  private async toDataServiceThread(dialectAccountDto: DialectAccountDto) {
    const { publicKey, dialect } = dialectAccountDto;
    const meMember = findMember(this.me, dialect);
    const otherMembers = findOtherMembers(this.me, dialect);
    if (!meMember || !otherMembers.length) {
      throw new IllegalStateError(
        `Cannot resolve members from given list: ${dialect.members.map(
          (it) => it.publicKey,
        )} and wallet public key ${this.me.toString()}`,
      );
    }
    const { serde, canBeDecrypted } = await this.createTextSerde(dialect);
    const otherThreadMembers: ThreadMember[] = otherMembers.map((member) => ({
      address: member.publicKey,
      scopes: fromDataServiceScopes(member.scopes),
      // lastReadMessageTimestamp: new Date(), // TODO: implement
    }));
    const otherMembersPks = Object.fromEntries(
      otherThreadMembers.map((member) => [member.address.toString(), member]),
    );
    return new DataServiceThread(
      this.dataServiceDialectsApi,
      serde,
      this.encryptionKeysProvider,
      new Ed25519PublicKey(publicKey).toString(),
      {
        address: new Ed25519PublicKey(meMember.publicKey).toString(),
        scopes: fromDataServiceScopes(meMember.scopes),
        // lastReadMessageTimestamp: new Date(), // TODO: implement
      },
      otherThreadMembers,
      otherMembersPks,
      dialect.encrypted,
      canBeDecrypted,
      new Date(dialect.lastMessageTimestamp),
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
    const diffieHellmanKeyPair = await this.encryptionKeysProvider.getFailSafe(
      new Ed25519PublicKey(this.me),
    );
    const encryptionProps: EncryptionProps | null = diffieHellmanKeyPair && {
      diffieHellmanKeyPair,
      ed25519PublicKey: new Ed25519PublicKey(this.me).toBytes(),
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
        dialect.members.map((it) => new Ed25519PublicKey(it.publicKey)),
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
        this.dataServiceDialectsApi.find(query.id.address.toString()),
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
        memberPublicKeys: otherMembers.map((member) => member.toString()),
      }),
    );
    if (dialectAccountDtos.length > 1) {
      throw new IllegalStateError('Found multiple dialects with same members');
    }
    return dialectAccountDtos[0] ?? null;
  }
}

export class DataServiceThread implements Thread {
  readonly type = 'dialect-cloud';
  readonly id: ThreadId;

  constructor(
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly textSerde: TextSerde,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
    private readonly address: AccountAddress,
    readonly me: ThreadMember,
    readonly otherMembers: ThreadMember[],
    private readonly otherMembersPks: Record<string, ThreadMember>,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    public updatedAt: Date,
  ) {
    this.id = new ThreadId({
      type: this.type,
      address,
    });
  }

  async delete(): Promise<void> {
    await withErrorParsing(
      this.dataServiceDialectsApi.delete(this.address.toString()),
    );
  }

  async messages(): Promise<ThreadMessage[]> {
    const { dialect } = await withErrorParsing(
      this.dataServiceDialectsApi.find(this.address.toString()),
    );
    this.updatedAt = new Date(dialect.lastMessageTimestamp);
    if (this.encryptionEnabledButCannotBeUsed()) {
      return [];
    }
    return dialect.messages.map((it) => ({
      author:
        it.owner === this.me.address.toString()
          ? this.me
          : this.otherMembersPks[it.owner]!,
      timestamp: new Date(it.timestamp),
      text: this.textSerde.deserialize(new Uint8Array(it.text)),
      deduplicationId: it.deduplicationId,
    }));
  }

  async send(command: SendMessageCommand): Promise<void> {
    if (this.encryptionEnabledButCannotBeUsed()) {
      await this.encryptionKeysProvider.getFailFast(
        new Ed25519PublicKey(this.me.address),
      );
    }
    await withErrorParsing(
      this.dataServiceDialectsApi.sendMessage(this.address.toString(), {
        text: Array.from(this.textSerde.serialize(command.text)),
        deduplicationId: command.deduplicationId,
      }),
    );
  }

  async setLastReadMessageTime(time: Date): Promise<void> {
    await withErrorParsing(
      this.dataServiceDialectsApi.patchMember(this.id.address.toString(), {
        lastReadMessageTimestamp: time.getTime(),
      }),
    );
  }

  private encryptionEnabledButCannotBeUsed() {
    return this.encryptionEnabled && !this.canBeDecrypted;
  }
}

function fromDataServiceScopes(scopes: MemberScopeDto[]) {
  return scopes.map((it) => ThreadMemberScope[it]);
}

function toDataServiceScopes(scopes: ThreadMemberScope[]) {
  return scopes.map((it) => MemberScopeDto[it]);
}

function findMember(memberPk: AccountAddress, dialect: DialectDto) {
  return dialect.members.find((it) => memberPk === it.publicKey) ?? null;
}

function findOtherMembers(memberPk: AccountAddress, dialect: DialectDto) {
  return dialect.members.filter((it) => memberPk !== it.publicKey);
}
