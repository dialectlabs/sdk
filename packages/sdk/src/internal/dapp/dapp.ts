import type { DataServiceApiClientError } from '../../dialect-cloud-api/data-service-api';
import type {
  DappDto,
  DataServiceDappsApi,
} from '../../dialect-cloud-api/data-service-dapps-api';
import { ResourceNotFoundError } from '../../sdk/errors';
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
} from '../../dapp/dapp.interface';
import type { DataServiceDappNotificationTypes } from './data-service-dapp-notification-types';
import type { DataServiceDappNotificationSubscriptions } from './data-service-dapp-notification-subscriptions';
import { withErrorParsing } from '../../dialect-cloud-api/data-service-errors';
import type { AccountAddress } from '../../auth/auth.interface';

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
      dappDto.publicKey,
      dappDto.name,
      dappDto.verified,
      dappDto.telegramBotUserName,
      this.dappAddresses,
      this.dappMessages,
      this.notificationTypes,
      this.notificationSubscriptions,
      dappDto.description,
      dappDto.websiteUrl,
      dappDto.avatarUrl,
      dappDto.heroUrl,
    );
  }

  async findAll(query?: FindDappQuery): Promise<ReadOnlyDapp[]> {
    const dappDtos = await withErrorParsing(
      this.dappsApi.findAll({
        verified: query?.verified,
      }),
    );
    return dappDtos.map((it) => ({
      address: it.publicKey,
      name: it.name,
      description: it.description,
      websiteUrl: it.websiteUrl,
      avatarUrl: it.avatarUrl,
      heroUrl: it.heroUrl,
      verified: it.verified,
      telegramUsername: it.telegramBotUserName,
    }));
  }

  async create(command: CreateDappCommand): Promise<Dapp> {
    const dappDto = await withErrorParsing(
      this.dappsApi.create({
        name: command.name,
        description: command.description,
        websiteUrl: command.websiteUrl,
        avatarUrl: command.avatarUrl,
        heroUrl: command.heroUrl,
        telegramBotConfiguration: command.telegramBotConfiguration,
      }),
    );
    return this.toDapp(dappDto);
  }
}

export class DappImpl implements Dapp {
  constructor(
    readonly address: AccountAddress,
    readonly name: string,
    readonly verified: boolean,
    readonly telegramUsername: string,
    readonly dappAddresses: DappAddresses,
    readonly messages: DappMessages,
    readonly notificationTypes: DappNotificationTypes,
    readonly notificationSubscriptions: DappNotificationSubscriptions,
    readonly description?: string,
    readonly websiteUrl?: string,
    readonly avatarUrl?: string,
    readonly heroUrl?: string,
  ) {}
}
