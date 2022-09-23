import { TokenProvider } from 'auth/token-provider';
import type {
  DataServiceWalletNotificationSubscriptionsApi,
  NotificationConfigDto,
  NotificationTypeDto,
  WalletNotificationSubscriptionDto,
} from '../../src/dialect-cloud-api/data-service-wallet-notification-subscriptions-api';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import type { DappDto } from '../../src/dialect-cloud-api/data-service-dapps-api';
import { Ed25519AuthenticationFacadeFactory } from 'auth/ed25519/ed25519-authentication-facade-factory';
import type { AccountAddress } from 'auth/auth.interface';
import { Ed25519TokenSigner } from 'auth/ed25519/ed25519-token-signer';

describe('Data service wallet notification subscriptions api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let api: DataServiceWalletNotificationSubscriptionsApi;
  let notificationType: NotificationTypeDto;
  let dapp: DappDto;
  let dappPublicKey: AccountAddress;
  let userPublicKey: AccountAddress;

  beforeEach(async () => {
    const dappAuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    dappPublicKey = dappAuthenticationFacade.subject();
    const dappDataServiceApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(dappAuthenticationFacade),
    );
    dapp = await dappDataServiceApi.dapps.create({
      name: 'test-dapp' + new Date().toString(),
    });
    notificationType = await dappDataServiceApi.dappNotificationTypes.create({
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 10,
      defaultConfig: {
        enabled: true,
      },
    });
    const userAuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
      new Ed25519TokenSigner(),
    ).get();
    userPublicKey = userAuthenticationFacade.subject();
    api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(userAuthenticationFacade),
    ).walletNotificationSubscriptions;
  });

  test('can find all subscriptions, returns default config from notification type', async () => {
    // when
    const found = await api.findAll({ dappPublicKey: dapp.publicKey });
    // then
    const expected: WalletNotificationSubscriptionDto = {
      notificationType,
      subscription: {
        wallet: {
          id: expect.any(String),
          publicKey: userPublicKey.toString(),
        },
        config: notificationType.defaultConfig,
      },
    };
    expect(found).toMatchObject([expected]);
  });

  test('can upsert subscription config', async () => {
    // given
    const upsertConfig: NotificationConfigDto = {
      enabled: false,
    };
    const notificationTypeId = notificationType.id;
    const upsertResult = await api.upsert({
      notificationTypeId: notificationTypeId,
      config: upsertConfig,
    });
    const found = await api.findAll({ dappPublicKey: dapp.publicKey });
    // then
    const expected: WalletNotificationSubscriptionDto = {
      notificationType,
      subscription: {
        wallet: {
          id: expect.any(String),
          publicKey: userPublicKey.toString(),
        },
        config: upsertConfig,
      },
    };
    expect(upsertResult).toMatchObject(expected);
    expect(found).toMatchObject([expected]);
  });
});
