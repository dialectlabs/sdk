import { TokenProvider } from '../core/auth/token-provider';
import type {
  CreateNotificationTypeCommandDto,
  DataServiceDappNotificationTypesApi,
} from './data-service-dapp-notification-types-api';
import { DialectWalletAdapterWrapper } from '../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../wallet-adapter/node-dialect-wallet-adapter';
import { DataServiceApi } from './data-service-api';
import type { NotificationTypeDto } from './data-service-wallet-notification-subscriptions-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../solana/auth/ed25519/ed25519-token-signer';
import type { DappDto } from './data-service-dapps-api';
import { Ed25519AuthenticationFacadeFactory } from '../core/auth/ed25519/ed25519-authentication-facade-factory';

describe('Data service dapp notification types api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let dappWallet: DialectWalletAdapterWrapper;
  let api: DataServiceDappNotificationTypesApi;
  let dapp: DappDto;

  beforeEach(async () => {
    dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    const dataServiceApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new Ed25519AuthenticationFacadeFactory(
          new DialectWalletAdapterEd25519TokenSigner(dappWallet),
        ).get(),
      ),
    );
    api = dataServiceApi.dappNotificationTypes;
    dapp = await dataServiceApi.dapps.create({
      name: 'test-dapp' + new Date().toString(),
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
