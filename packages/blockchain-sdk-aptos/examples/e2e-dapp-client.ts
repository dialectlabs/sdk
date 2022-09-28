import { HexString } from 'aptos';
import {
  Address,
  AddressType,
  DappAddress,
  Dialect,
  DialectSdk,
  Thread,
  ThreadMemberScope,
} from '@dialectlabs/sdk';
import { Aptos, AptosSdkFactory, NodeDialectAptosWalletAdapter } from '../src';
import { dappAccountAddress } from './e2e-shared';

const clientPrivateKey: Uint8Array = HexString.ensure(
  '0x0058770933d80d9e91326770252d7e99719f79ff7c1cd7aefc6096cd46ff0f04',
).toUint8Array();

const sdk: DialectSdk<Aptos> = Dialect.sdk(
  {
    environment: 'development',
  },
  AptosSdkFactory.create({
    wallet: NodeDialectAptosWalletAdapter.create(clientPrivateKey),
  }),
);

async function main() {
  const notificationsThread: Thread = await bootstrapNotificationSubscription();
  let lastMessageTimestamp = new Date().getTime();
  while (true) {
    const newMessages = (await notificationsThread.messages()).filter(
      ({ timestamp }) => timestamp.getTime() > lastMessageTimestamp,
    );
    if (newMessages.length > 0) {
      lastMessageTimestamp = new Date().getTime();
      console.log(
        `New messages: ${JSON.stringify(
          newMessages.map((it) => ({
            timstamp: it.timestamp,
            message: it.text,
          })),
          null,
          2,
        )}`,
      );
    }
    await sleep(2000);
  }
}

main().catch((e) => console.log(e));

async function bootstrapNotificationSubscription(): Promise<Thread> {
  const address: Address = await getOrCreateAddress();
  console.log(`Client address: ${JSON.stringify(address)}`);
  const dappAddress: DappAddress = await getOrCreateDappAddress(address.id);
  console.log(`Client dapp address: ${JSON.stringify(dappAddress)}`);
  const notificationsThread: Thread = await getOrCreateNotificationsThread();
  console.log(`Notifications thread: ${notificationsThread.id}`);
  return notificationsThread;
}

async function getOrCreateAddress(): Promise<Address> {
  const addresses: Address[] = await sdk.wallet.addresses.findAll();
  const address: Address | null =
    addresses.find((it) => it.type === AddressType.Wallet) ?? null;
  if (!address) {
    console.log(`Address not found, creating...`);
    return sdk.wallet.addresses.create({
      value: sdk.wallet.address,
      type: AddressType.Wallet,
    });
  }
  return address;
}

async function getOrCreateDappAddress(addressId: string): Promise<DappAddress> {
  const dappAddresses: DappAddress[] = await sdk.wallet.dappAddresses.findAll();
  const dappAddress: DappAddress | null =
    dappAddresses.find((it) => it.address.id === addressId) ?? null;
  if (!dappAddress) {
    console.log(`Dapp address not found, creating...`);
    return sdk.wallet.dappAddresses.create({
      dappAccountAddress: dappAccountAddress.toString(),
      addressId,
      enabled: true,
    });
  }
  return dappAddress;
}

async function getOrCreateNotificationsThread(): Promise<Thread> {
  const notificationThread: Thread | null = await sdk.threads.find({
    otherMembers: [dappAccountAddress.toString()],
  });
  if (!notificationThread) {
    console.log(`Notification thread not found, creating...`);
    return sdk.threads.create({
      encrypted: false,
      me: {
        scopes: [ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          address: dappAccountAddress.toString(),
          scopes: [ThreadMemberScope.WRITE],
        },
      ],
    });
  }
  return notificationThread;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
