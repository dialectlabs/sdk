import type { AccountAddress } from '../../src';
import {
  DataServiceApiFactory,
  DataServiceWalletsApiClientV1,
  Ed25519AuthenticationFacadeFactory,
  Ed25519TokenSigner,
  TokenProvider,
} from '../../src';
import type {
  CreateNotificationTypeCommandDto,
  DataServiceDappNotificationTypesApi,
} from '../../src/dialect-cloud-api/data-service-dapp-notification-types-api';
import type { NotificationTypeDto } from '../../src/dialect-cloud-api/data-service-wallet-notification-subscriptions-api';
import type { DappDto } from '../../src/dialect-cloud-api/data-service-dapps-api';
import { BlockchainType } from '@dialectlabs/sdk';

describe('Data service dapp notification types api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let walletAccountAddress: AccountAddress;
  let api: DataServiceDappNotificationTypesApi;
  let dapp: DappDto;

  beforeEach(async () => {
    const authenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    walletAccountAddress = authenticationFacade.subject();
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(baseUrl);
    const dataServiceApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(authenticationFacade, dataServiceWalletsApiV1),
    );
    api = dataServiceApi.dappNotificationTypes;
    dapp = await dataServiceApi.dapps.create({
      name: 'test-dapp' + new Date().toString(),
      blockchainType: BlockchainType.SOLANA,
    });
  });

  test('can create notification type', async () => {
    // given
    const tags = ['announcement', 'test'];
    const command: CreateNotificationTypeCommandDto = {
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 10,
      tags: tags,
      defaultConfig: {
        enabled: true,
      },
    };
    // when
    const created = await api.create(command);
    // then
    const expected: NotificationTypeDto = {
      ...command,
      id: expect.any(String),
      dappId: dapp.id,
      humanReadableId: command.humanReadableId.toLowerCase().trim(),
      tags,
    };
    expect(created).toMatchObject(expected);
  });

  test('can find all notification types', async () => {
    // given
    const tags = ['announcement', 'test'];
    const command: CreateNotificationTypeCommandDto = {
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 10,
      tags: tags,
      defaultConfig: {
        enabled: true,
      },
    };
    await api.create(command);
    // when
    const all = await api.findAll();
    // then
    const expected: NotificationTypeDto[] = [
      {
        ...command,
        id: expect.any(String),
        dappId: dapp.id,
        humanReadableId: command.humanReadableId.toLowerCase().trim(),
        tags,
      },
    ];
    expect(all).toMatchObject(expected);
  });

  test('can find notification type', async () => {
    // given
    const tags = ['announcement', 'test'];
    const command: CreateNotificationTypeCommandDto = {
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 10,
      tags: tags,
      defaultConfig: {
        enabled: true,
      },
    };
    const created = await api.create(command);
    // when
    const found = await api.find(created.id);
    // then
    const expected: NotificationTypeDto = {
      ...command,
      id: expect.any(String),
      dappId: dapp.id,
      humanReadableId: command.humanReadableId.toLowerCase().trim(),
      tags,
    };
    expect(found).toMatchObject(expected);
  });

  test('can patch notification type', async () => {
    // given
    const tags = ['announcement', 'test'];
    const createCommand: CreateNotificationTypeCommandDto = {
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 12,
      tags: tags,
      defaultConfig: {
        enabled: true,
      },
    };
    const created = await api.create(createCommand);
    const patchCommand: CreateNotificationTypeCommandDto = {
      name: 'test2',
      humanReadableId: 'test2' + new Date().toString(),
      trigger: '2282',
      orderingPriority: 0,
      tags: [],
      defaultConfig: {
        enabled: false,
      },
    };
    // when
    const patched = await api.patch(created.id, patchCommand);
    // then
    const expected: NotificationTypeDto = {
      ...patchCommand,
      id: expect.any(String),
      dappId: dapp.id,
      humanReadableId: patchCommand.humanReadableId.toLowerCase().trim(),
      tags: patchCommand.tags!,
    };
    expect(patched).toMatchObject(expected);
  });

  test('can delete notification type', async () => {
    // given
    const tags = ['announcement', 'test'];
    const createCommand: CreateNotificationTypeCommandDto = {
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 10,
      tags: tags,
      defaultConfig: {
        enabled: true,
      },
    };
    const created = await api.create(createCommand);
    // when
    await api.delete(created.id);
    // then
    await expect(api.find(created.id)).rejects.toBeTruthy();
  });
});
