import { TokenProvider } from '../../src/auth/token-provider';
import type {
  DataServiceWalletNotificationSubscriptionsApi,
  NotificationConfigDto,
  NotificationTypeDto,
  WalletNotificationSubscriptionDto,
} from '../../src/dialect-cloud-api/data-service-wallet-notification-subscriptions-api';
import { DataServiceApi } from '../../src/dialect-cloud-api/data-service-api';
import type { DappDto } from '../../src/dialect-cloud-api/data-service-dapps-api';
import { Ed25519AuthenticationFacadeFactory } from '../../src/auth/ed25519/ed25519-authentication-facade-factory';
import type { AccountAddress } from '../../src/auth/auth.interface';
import { Ed25519TokenSigner } from '../../src/auth/ed25519/ed25519-token-signer';
import { DataServiceApiFactory } from '../../src/dialect-cloud-api/data-service-api-factory';
import { DataServiceWalletsApiClientV1 } from '../../src/dialect-cloud-api/data-service-wallets-api.v1';

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
    const dappDataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    const dappDataServiceApi = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(dappAuthenticationFacade,dappDataServiceWalletsApiV1),
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
    const userDataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      baseUrl,
    );
    api = DataServiceApiFactory.create(
      baseUrl,
      TokenProvider.create(userAuthenticationFacade, userDataServiceWalletsApiV1),
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
