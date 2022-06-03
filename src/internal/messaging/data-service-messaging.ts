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
import { PublicKey } from '@solana/web3.js';
import {
  EncryptedTextSerde,
  EncryptionProps,
  TextSerde,
  UnencryptedTextSerde,
} from '@dialectlabs/web3';
import type {
  DataServiceApiClientError,
  DataServiceDialectsApi,
} from '@data-service-api/data-service-api';
import {
  DialectAccountDto,
  DialectDto,
  MemberScopeDto,
} from '@data-service-api/data-service-api';
import { IllegalStateError } from '@sdk/errors';
import type { EncryptionKeysProvider } from '@encryption/encryption-keys-provider';

export class DataServiceMessaging implements Messaging {
  constructor(
    private readonly me: PublicKey,
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly encryptionKeysProvider: EncryptionKeysProvider,
  ) {}

  async create(command: CreateDialectCommand): Promise<Thread> {
    command.encrypted && (await this.checkEncryptionSupported());
    const dialectAccountDto = await this.dataServiceDialectsApi.create({
      encrypted: command.encrypted,
      members: [
        {
          publicKey: this.me.toBase58(),
          scopes: toDataServiceScopes(command.me.scopes),
        },
        {
          publicKey: command.otherMember.publicKey.toBase58(),
          scopes: toDataServiceScopes(command.otherMember.scopes),
        },
      ],
    });
    return this.toDataServiceThread(dialectAccountDto);
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
    const { serde, decrypted } = await this.createTextSerde(dialect);
    return new DataServiceThread(
      this.dataServiceDialectsApi,
      serde,
      new PublicKey(publicKey),
      {
        publicKey: new PublicKey(meMember.publicKey),
        scopes: fromDataServiceScopes(meMember.scopes),
      },
      {
        publicKey: new PublicKey(otherMember.publicKey),
        scopes: fromDataServiceScopes(otherMember.scopes),
      },
      dialect.encrypted,
      decrypted,
    );
  }

  private async createTextSerde(dialect: DialectDto): Promise<{
    serde: TextSerde;
    decrypted: boolean;
  }> {
    if (!dialect.encrypted) {
      return {
        serde: new UnencryptedTextSerde(),
        decrypted: true,
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
        decrypted: false,
      };
    }
    return {
      serde: new EncryptedTextSerde(
        encryptionProps,
        dialect.members.map((it) => new PublicKey(it.publicKey)),
      ),
      decrypted: true,
    };
  }

  async find(query: FindDialectQuery): Promise<Thread | null> {
    const dialectAccountDto = await this.findInternal(query);
    return dialectAccountDto && this.toDataServiceThread(dialectAccountDto);
  }

  private findInternal(
    query: FindDialectByAddressQuery | FindDialectByOtherMemberQuery,
  ) {
    if ('address' in query) {
      return this.findByAddress(query);
    }
    return this.findByOtherMember(query);
  }

  private async findByAddress(query: FindDialectByAddressQuery) {
    try {
      return await this.dataServiceDialectsApi.find(query.address.toBase58());
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err.statusCode === 404) {
        return null;
      }
      throw e;
    }
  }

  private async findByOtherMember(query: FindDialectByOtherMemberQuery) {
    const dialectAccountDtos = await this.dataServiceDialectsApi.findAll({
      memberPublicKey: query.otherMember.toBase58(),
    });
    if (dialectAccountDtos.length > 1) {
      throw new IllegalStateError('Found multiple dialects with same members');
    }
    return dialectAccountDtos[0] ?? null;
  }

  async findAll(): Promise<Thread[]> {
    const dialectAccountDtos = await this.dataServiceDialectsApi.findAll();
    return Promise.all(
      dialectAccountDtos.map((it) => this.toDataServiceThread(it)),
    );
  }
}

export class DataServiceThread implements Thread {
  constructor(
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly textSerde: TextSerde,
    readonly address: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encryptionEnabled: boolean,
    readonly canBeDecrypted: boolean,
  ) {}

  async delete(): Promise<void> {
    await this.dataServiceDialectsApi.delete(this.address.toBase58());
  }

  async messages(): Promise<Message[]> {
    const { dialect } = await this.dataServiceDialectsApi.find(
      this.address.toBase58(),
    );
    if (this.encryptionEnabled && !this.canBeDecrypted) {
      return [];
    }
    return dialect.messages.map((it) => ({
      author:
        it.owner === this.me.publicKey.toBase58() ? this.me : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: this.textSerde.deserialize(new Uint8Array(it.text)),
    }));
  }

  async send(command: SendMessageCommand): Promise<void> {
    await this.dataServiceDialectsApi.sendMessage(this.address.toBase58(), {
      text: Array.from(this.textSerde.serialize(command.text)),
    });
  }
}

function fromDataServiceScopes(scopes: MemberScopeDto[]) {
  return scopes.map((it) => DialectMemberScope[it]);
}

function toDataServiceScopes(scopes: DialectMemberScope[]) {
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
