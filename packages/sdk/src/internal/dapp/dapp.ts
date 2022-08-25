import type {
  CreateDappCommand,
  Dapp,
  DappAddresses,
  DappMessages,
  DappNotificationSubscriptions,
  DappNotificationTypes,
  Dapps,
  FindDappQuery,
  ReadOnlyDapp,
} from '@dapp/dapp.interface';
import { PublicKey } from '@solana/web3.js';
import type {
  DappDto,
  DataServiceDappsApi,
} from '@data-service-api/data-service-dapps-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type { DataServiceApiClientError } from '@data-service-api/data-service-api';
import { ResourceNotFoundError } from '@sdk/errors';
import type { DataServiceDappNotificationTypes } from '@dapp/internal/dapp-notification-types';
import type { DataServiceDappNotificationSubscriptions } from '@dapp/internal/dapp-notification-subscriptions';

export class DappsImpl implements Dapps {
  constructor(
    private readonly dappAddresses: DappAddresses,
    private readonly dappMessages: DappMessages,
    private readonly notificationTypes: DataServiceDappNotificationTypes,
    private readonly notificationSubscriptions: DataServiceDappNotificationSubscriptions,
    private readonly dappsApi: DataServiceDappsApi,
  ) {}

  async find(): Promise<Dapp | null> {
    try {
      const dappDto = await withErrorParsing(this.dappsApi.find());
      return this.toDapp(dappDto);
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  private toDapp(dappDto: DappDto) {
    return new DappImpl(
      new PublicKey(dappDto.publicKey),
      dappDto.name,
      dappDto.verified,
      dappDto.telegramBotUserName,
      this.dappAddresses,
      this.dappMessages,
      this.notificationTypes,
      this.notificationSubscriptions,
      dappDto.description,
      dappDto.avatarUrl,
    );
  }

  async findAll(query?: FindDappQuery): Promise<ReadOnlyDapp[]> {
    const dappDtos = await withErrorParsing(
      this.dappsApi.findAll({
        verified: query?.verified,
      }),
    );
    return dappDtos.map((it) => ({
      publicKey: new PublicKey(it.publicKey),
      name: it.name,
      description: it.description,
      verified: it.verified,
      avatarUrl: it.avatarUrl,
      telegramUsername: it.telegramBotUserName,
    }));
  }

  async create(command: CreateDappCommand): Promise<Dapp> {
    const dappDto = await withErrorParsing(
      this.dappsApi.create({
        name: command.name,
        description: command.description,
        avatarUrl: command.avatarUrl,
        telegramBotConfiguration: command.telegramBotConfiguration,
      }),
    );
    return this.toDapp(dappDto);
  }
}

export class DappImpl implements Dapp {
  constructor(
    readonly publicKey: PublicKey,
    readonly name: string,
    readonly verified: boolean,
    readonly telegramUsername: string,
    readonly dappAddresses: DappAddresses,
    readonly messages: DappMessages,
    readonly notificationTypes: DappNotificationTypes,
    readonly notificationSubscriptions: DappNotificationSubscriptions,
    readonly description?: string,
    readonly avatarUrl?: string,
  ) {}
}
