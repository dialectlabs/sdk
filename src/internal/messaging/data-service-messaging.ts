import type {
  CreateThreadCommand,
  FindThreadByIdQuery,
  FindThreadByOtherMemberQuery,
  FindThreadQuery,
  FindThreadSummaryByMembers,
  Messaging,
  SendMessageCommand,
  Thread,
  ThreadMember,
  ThreadMemberSummary,
  ThreadMessage,
  ThreadSummary,
} from '@messaging/messaging.interface';
import { ThreadId, ThreadMemberScope } from '@messaging/messaging.interface';
import { PublicKey } from '@solana/web3.js';
import {
  EncryptedTextSerde,
  EncryptionProps,
  TextSerde,
  UnencryptedTextSerde,
} from '@dialectlabs/web3';
import {
  IllegalStateError,
  ResourceNotFoundError,
  ThreadAlreadyExistsError,
} from '@sdk/errors';
import { Backend } from '@sdk/sdk.interface';
import { requireSingleMember } from '@messaging/internal/commons';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type { DataServiceDialectsApi } from '@data-service-api/data-service-dialects-api';
import {
  DialectAccountDto,
  DialectDto,
  MemberScopeDto,
} from '@data-service-api/data-service-dialects-api';
import type { DataServiceApiClientError } from '@data-service-api/data-service-api';
import type { EncryptionKeysProvider } from '@encryption/internal/encryption-keys-provider';

export class DataServiceMessaging implements Messaging {
  constructor(
    private readonly me: PublicKey,
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
  ) {}

  async create(command: CreateThreadCommand): Promise<Thread> {
    command.encrypted && (await this.checkEncryptionSupported());
    const otherMember = requireSingleMember(command.otherMembers);
    const dialectAccountDto = await withErrorParsing(
      this.dataServiceDialectsApi.create({
        encrypted: command.encrypted,
        members: [
          {
            publicKey: this.me.toBase58(),
            scopes: toDataServiceScopes(command.me.scopes),
          },
          {
            publicKey: otherMember.publicKey.toBase58(),
            scopes: toDataServiceScopes(otherMember.scopes),
          },
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
    const otherMember = findOtherMember(this.me, dialect);
    if (!meMember || !otherMember) {
      throw new IllegalStateError(
        `Cannot resolve members from given list: ${dialect.members.map(
          (it) => it.publicKey,
        )} and wallet public key ${this.me.toBase58()}`,
      );
    }
    const { serde, canBeDecrypted } = await this.createTextSerde(dialect);
    const otherThreadMember: ThreadMember = {
      publicKey: new PublicKey(otherMember.publicKey),
      scopes: fromDataServiceScopes(otherMember.scopes),
      // lastReadMessageTimestamp: new Date(), // TODO: implement
    };
    return new DataServiceThread(
      this.dataServiceDialectsApi,
      serde,
      this.encryptionKeysProvider,
      new PublicKey(publicKey),
      {
        publicKey: new PublicKey(meMember.publicKey),
        scopes: fromDataServiceScopes(meMember.scopes),
        // lastReadMessageTimestamp: new Date(), // TODO: implement
      },
      [otherThreadMember],
      otherThreadMember,
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
    const otherMember = requireSingleMember(query.otherMembers);
    const dialectAccountDtos = await withErrorParsing(
      this.dataServiceDialectsApi.findAll({
        memberPublicKey: otherMember.toBase58(),
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
    private readonly otherMember: ThreadMember,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
    public updatedAt: Date,
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
        it.owner === this.me.publicKey.toBase58() ? this.me : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: this.textSerde.deserialize(new Uint8Array(it.text)),
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
      }),
    );
  }

  setLastReadMessageTime(time: Date): Promise<void> {
    return Promise.resolve(undefined);
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

function findOtherMember(memberPk: PublicKey, dialect: DialectDto) {
  return (
    dialect.members.find((it) => memberPk.toBase58() !== it.publicKey) ?? null
  );
}
