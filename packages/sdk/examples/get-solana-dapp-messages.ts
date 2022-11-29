import {
  AddressType,
  DataServiceApi,
  Ed25519AuthenticationFacadeFactory,
  Ed25519TokenSigner,
  FindNotificationSubscriptionQuery,
  IllegalStateError,
  ThreadMemberScope,
  TokenProvider,
  UpsertNotificationSubscriptionCommand,
} from '../src';
import { AddressTypeDto } from '../src/dialect-cloud-api/data-service-dapps-api';
import { DataServiceWalletsApiClientV1 } from '../src/dialect-cloud-api/data-service-wallets-api.v1';
import { createSolanaSdk } from './helpers';

(async () => {
  const sdk1 = createSolanaSdk();
  const sdk2 = createSolanaSdk();

  const dappAuthenticationFacade = new Ed25519AuthenticationFacadeFactory(
    new Ed25519TokenSigner(),
  ).get();

  // create dapp api
    const dataServiceWalletsApiV1 = new DataServiceWalletsApiClientV1(
      sdk1.config.dialectCloud.url,
    );
  const dappDataServiceApi = DataServiceApi.create(
    sdk1.config.dialectCloud.url,
    TokenProvider.create(dappAuthenticationFacade, dataServiceWalletsApiV1),
  );

  // create dapp
  const newDapp = await dappDataServiceApi.dapps.create({
    name: 'test-dapp' + new Date().toString(),
  });
  const notificationType =
    await dappDataServiceApi.dappNotificationTypes.create({
      name: 'test',
      humanReadableId: 'test' + new Date().toString(),
      trigger: '228',
      orderingPriority: 10,
      defaultConfig: {
        enabled: true,
      },
    });

  const dapp = await dappDataServiceApi.dapps.find();
  if (!dapp) {
    throw new IllegalStateError(
      "Dapp doesn't exist, please create dapp before using it",
    );
  }

  const notificationTypeId = notificationType.id;

  const upsertConfig: UpsertNotificationSubscriptionCommand = {
    notificationTypeId: notificationTypeId,
    config: {
      enabled: true,
    },
  };

  const query: FindNotificationSubscriptionQuery = {
    dappAccountAddress: dapp.publicKey,
  };

  const recipient = sdk1.blockchainSdk.authenticationFacade.subject();
  const recipient2 = sdk2.blockchainSdk.authenticationFacade.subject();

  const address1 = await sdk1.wallet.addresses.create({
    type: AddressType.Wallet,
    value: recipient,
  });
  await sdk1.wallet.dappAddresses.create({
    dappAccountAddress: dapp.publicKey,
    addressId: address1.id,
    enabled: true,
  });
  await sdk1.wallet.notificationSubscriptions.upsert(upsertConfig);

  const address2 = await sdk2.wallet.addresses.create({
    type: AddressType.Wallet,
    value: recipient2,
  });
  await sdk2.wallet.dappAddresses.create({
    dappAccountAddress: dapp.publicKey,
    addressId: address2.id,
    enabled: true,
  });
  await sdk2.wallet.notificationSubscriptions.upsert(upsertConfig);

  const thread1 = await sdk1.threads.create({
    me: {
      scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
    },
    otherMembers: [
      {
        address: dapp.publicKey,
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
    ],
    encrypted: false,
  });

  const thread2 = await sdk2.threads.create({
    me: {
      scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
    },
    otherMembers: [
      {
        address: dapp.publicKey,
        scopes: [ThreadMemberScope.WRITE, ThreadMemberScope.ADMIN],
      },
    ],
    encrypted: false,
  });

  try {
    // Unicast
    await dappDataServiceApi.dapps.unicast({
      title: 'Hello',
      message: 'Hello, world 1',
      recipientPublicKey: recipient,
      notificationTypeId,
    });

    // Multicast
    await dappDataServiceApi.dapps.multicast({
      title: 'Hello',
      message: 'Hello, world 2',
      notificationTypeId,
      recipientPublicKeys: [recipient, recipient2],
    });

    // Broadcast, in this case notification is sent to all dapp subscribers using all user-enabled notification channels
    await dappDataServiceApi.dapps.broadcast({
      title: 'Hello',
      message: 'Hello, world 3',
      notificationTypeId,
    });

    // Unicast, but only to wallet channel (Dialect, Solflare or Step inboxes)
    await dappDataServiceApi.dapps.unicast({
      title: 'Hello, dialectooooor',
      message: 'Hello, world 4',
      recipientPublicKey: recipient,
      notificationTypeId,
      addressTypes: [AddressTypeDto.Wallet],
    });

    // // Multicast, but only to wallet channel (Dialect, Solflare or Step inboxes)
    await dappDataServiceApi.dapps.multicast({
      title: 'Hello, telegramoooors',
      message: 'Hello, world',
      recipientPublicKeys: [recipient, recipient2],
      notificationTypeId,
      addressTypes: [AddressTypeDto.Telegram],
    });

    // // Per-channel broadcast, in this case notification is sent all dapp subscribers but to only specificied channels, e.g. telegram, sms, email, wallet
    await dappDataServiceApi.dapps.broadcast({
      title: 'Hello to sms and telegram subscribers',
      message: 'Hello, world',
      notificationTypeId,
      addressTypes: [AddressTypeDto.Telegram, AddressTypeDto.PhoneNumber],
    });
  } catch (e) {
    console.log('ERROR:', e);
  }

  const messages1 = await thread1.messages();
  console.log({ messages1 });

  const messages2 = await thread2.messages();
  console.log({ messages2 });
})();
