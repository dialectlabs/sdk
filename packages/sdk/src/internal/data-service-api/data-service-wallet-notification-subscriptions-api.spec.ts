import { TokenProvider } from '../../auth/token-provider';
import { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../wallet-adapter/node-dialect-wallet-adapter';
import type {
  DataServiceWalletNotificationSubscriptionsApi,
  NotificationConfigDto,
  NotificationTypeDto,
  WalletNotificationSubscriptionDto,
} from './data-service-wallet-notification-subscriptions-api';
import { DataServiceApi } from './data-service-api';
import { DialectWalletAdapterEd25519TokenSigner } from '../../auth/signers/ed25519-token-signer';
import type { DappDto } from './data-service-dapps-api';

describe('Data service wallet notification subscriptions api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  let api: DataServiceWalletNotificationSubscriptionsApi;
  let notificationType: NotificationTypeDto;
  let dapp: DappDto;
  let userWallet: DialectWalletAdapterWrapper;

  beforeEach(async () => {
    const dappWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    const dappDataServiceApi = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(dappWallet),
      ),
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
    userWallet = new DialectWalletAdapterWrapper(
      NodeDialectWalletAdapter.create(),
    );
    api = DataServiceApi.create(
      baseUrl,
      TokenProvider.create(
        new DialectWalletAdapterEd25519TokenSigner(userWallet),
      ),
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
          publicKey: userWallet.publicKey.toBase58(),
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
          publicKey: userWallet.publicKey.toBase58(),
        },
        config: upsertConfig,
      },
    };
    expect(upsertResult).toMatchObject(expected);
    expect(found).toMatchObject([expected]);
  });
});
