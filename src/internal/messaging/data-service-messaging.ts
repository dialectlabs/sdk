import type {
  CreateDialectCommand,
  Thread,
  DialectMember,
  FindDialectQuery,
  Message,
  Messaging,
  SendMessageCommand,
} from '@messaging/messaging.interface';
import { DialectMemberScope } from '@messaging/messaging.interface';
import { PublicKey } from '@solana/web3.js';
import type {
  ApiClientError,
  DataServiceDialectsApi,
} from '@data-service-api/data-service-api';
import {
  DialectAccountDto,
  DialectDto,
  MemberScopeDto,
} from '@data-service-api/data-service-api';

import { TextSerde, TextSerdeFactory } from '@dialectlabs/web3';
import { getEncryptionProps } from './messaging-common';
import type { DialectWalletAdapterImpl } from '@wallet-adapter/internal/dialect-wallet-adapter-impl';

export class DataServiceMessaging implements Messaging {
  constructor(
    private readonly walletAdapter: DialectWalletAdapterImpl,
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
  ) {}

  async create(command: CreateDialectCommand): Promise<Thread> {
    const dialectAccountDto = await this.dataServiceDialectsApi.create({
      encrypted: command.encrypted,
      members: [
        {
          publicKey: this.walletAdapter.publicKey.toBase58(),
          scopes: command.me.scopes.map((it) => MemberScopeDto[it]),
        },
        {
          publicKey: command.otherMember.publicKey.toBase58(),
          scopes: command.otherMember.scopes.map((it) => MemberScopeDto[it]),
        },
      ],
    });
    return this.toWeb2Dialect(dialectAccountDto);
  }

  private async toWeb2Dialect(dialectAccountDto: DialectAccountDto) {
    const { publicKey, dialect } = dialectAccountDto;
    const meMember = dialect.members.find(
      (it) => it.publicKey === this.walletAdapter.publicKey.toBase58(),
    );
    const otherMember = dialect.members.find(
      (it) => it.publicKey !== this.walletAdapter.publicKey.toBase58(),
    );
    if (!meMember || !otherMember) {
      throw new Error('Should not happen');
    }
    const textSerDe = await this.textSerde(dialect);
    return new DataServiceThread(
      this.dataServiceDialectsApi,
      textSerDe,
      new PublicKey(publicKey),
      {
        publicKey: new PublicKey(meMember.publicKey),
        scopes: meMember.scopes.map((it) => DialectMemberScope[it]),
      },
      {
        publicKey: new PublicKey(otherMember.publicKey),
        scopes: otherMember.scopes.map((it) => DialectMemberScope[it]),
      },
      dialect.encrypted,
    );
  }

  private async textSerde(dialect: DialectDto) {
    const encryptionProps = await getEncryptionProps(
      this.walletAdapter.canEncrypt(),
      this.walletAdapter,
    );
    return TextSerdeFactory.create(
      {
        encrypted: this.walletAdapter.canEncrypt(),
        memberPubKeys: dialect.members.map((it) => new PublicKey(it.publicKey)),
      },
      encryptionProps,
    );
  }

  async find(query: FindDialectQuery): Promise<Thread | null> {
    try {
      const dialectAccountDto = await this.dataServiceDialectsApi.find(
        query.publicKey.toBase58(),
      );
      return this.toWeb2Dialect(dialectAccountDto);
    } catch (e) {
      const err = e as ApiClientError;
      if (err.statusCode === 404) {
        return null;
      }
      throw e;
    }
  }

  async findAll(): Promise<Thread[]> {
    const dialectAccountDtos = await this.dataServiceDialectsApi.findAll();
    return Promise.all(dialectAccountDtos.map((it) => this.toWeb2Dialect(it)));
  }
}

export class DataServiceThread implements Thread {
  constructor(
    private readonly dataServiceDialectsApi: DataServiceDialectsApi,
    private readonly textSerDe: TextSerde,
    readonly publicKey: PublicKey,
    readonly me: DialectMember,
    readonly otherMember: DialectMember,
    readonly encrypted: boolean,
  ) {}

  async delete(): Promise<void> {
    await this.dataServiceDialectsApi.delete(this.publicKey.toBase58());
  }

  async messages(): Promise<Message[]> {
    const { dialect } = await this.dataServiceDialectsApi.find(
      this.publicKey.toBase58(),
    );
    return dialect.messages.map((it) => ({
      author:
        this.me.publicKey.toBase58() === it.owner ? this.me : this.otherMember,
      timestamp: new Date(it.timestamp),
      text: this.textSerDe.deserialize(new Uint8Array(it.text)),
    }));
  }

  async send(command: SendMessageCommand): Promise<void> {
    await this.dataServiceDialectsApi.sendMessage(this.publicKey.toBase58(), {
      text: Array.from(this.textSerDe.serialize(command.text)),
    });
  }
}
