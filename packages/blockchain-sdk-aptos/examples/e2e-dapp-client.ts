/*
  This is one of two files for testing end-to-end user subscriptions and notifications.
  This file manages the "client" — where the user wishing to subscribe for notifications
  would manage that.
*/

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

// Initialize an SDK for interacting with Dialect services. All SDKs have a wallet tied
// to them for authentication purposes. In this case, we are initializing an sdk for the
// user who wishes to setup notifications with a dapp or wallet.

// NOTE: This private key is for demonstration purposes only! Do not use private keys in production. The Dialect AptosSdkFactory fully supports traditional wallet adapters, and does not need access to the private key in any way.
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
  // First, let's get the user subscribed to receive notifications
  const notificationsThread: Thread = await setupUserSubscription();

  // Next, for the purposes of this simple demo, let's run a while loop to
  // monitor for new messages coming from the notifications sender.
  let lastMessageTimestamp = new Date().getTime();
  while (true) {
    // Get new messages based on last seen timestamp.
    const newMessages = (await notificationsThread.messages()).filter(
      ({ timestamp }) => timestamp.getTime() > lastMessageTimestamp,
    );
    // Log any new messages to the console
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

/*
  Functions for setting up subscriptions
*/

async function setupUserSubscription(): Promise<Thread> {
  // Subscriber subscribes to receive notifications (direct-to-wallet for in-app feed) from dapp.
  // This means first registering an "address" (which can be as simple as a public key, but also
  // an email, phone number, etc.), and then using that address to subscribe for notifications
  // from a project ("dapp").

  // First, we register an address for the user if one hasn't yet been registered.
  const address: Address = await getOrCreateAddress();
  console.log(`Subscriber address: ${JSON.stringify(address)}`);

  // Next, we use that address to subscribe for notifications from a dapp.
  const dappAddress: DappAddress = await getOrCreateSubscription(address.id);
  console.log(
    `Subscriber is subscribing to dapp address: ${JSON.stringify(dappAddress)}`,
  );

  // Lastly, we create the notifications thread, which is just a one-way
  // messaging thread between the dapp and the subscribing user.
  const notificationsThread: Thread = await getOrCreateNotificationsThread();
  console.log(
    `Notifications thread created with id: ${notificationsThread.id}`,
  );
  return notificationsThread;
}

async function getOrCreateAddress(): Promise<Address> {
  // Register an address

  // See if we have one already
  const addresses: Address[] = await sdk.wallet.addresses.findAll();
  const address: Address | null =
    addresses.find((it) => it.type === AddressType.Wallet) ?? null;

  // If not, let's register it
  if (!address) {
    console.log(`Address not found, creating...`);
    return sdk.wallet.addresses.create({
      value: sdk.wallet.address,
      type: AddressType.Wallet,
    });
  }
  return address;
}

async function getOrCreateSubscription(
  addressId: string,
): Promise<DappAddress> {
  // Subscribe for notifications from a dapp using an address (from function above)

  // Fetch all subscriptions this user's address already has
  const subscriptions: DappAddress[] = await sdk.wallet.dappAddresses.findAll();

  // Check if any subscriptions match this address and are subscribed to the
  // "dapp" from above
  // NOTE: DappAddress is effectively a Subscription, and will be renamed to this.
  // For a given Dapp, and a given user's Address, a DappAddress is the entity that
  // manages whether the user has subscribed to receive notifications from that
  // Dapp to that Address.
  const subscription: DappAddress | null =
    subscriptions.find((it) => it.address.id === addressId) ?? null;

  if (!subscription) {
    console.log(`Dapp address not found, creating...`);
    return sdk.wallet.dappAddresses.create({
      dappAccountAddress: dappAccountAddress.toString(), // The address of the "dapp" sender
      addressId, // The user/subscriber address they'd like to use to subscribe
      enabled: true, // Subscriptions are enableable/disableable. We start by enabling
    });
  }
  return subscription;
}

async function getOrCreateNotificationsThread(): Promise<Thread> {
  // Create the notifications thread, through which the user will
  // receive the notifications.

  // First find out if we have one. Like a messaging thread, it is
  // indexed by its members, which in this case is the user and the dapp.
  const notificationThread: Thread | null = await sdk.threads.find({
    otherMembers: [dappAccountAddress.toString()],
  });

  // If no thread exists, let's create it.
  if (!notificationThread) {
    console.log(`Notification thread not found, creating...`);
    return sdk.threads.create({
      encrypted: false,
      me: {
        // Admin scopes let the user manage thread. Note that the user does not have WRITE
        // privileges, since this is a one-way notifications thread.
        scopes: [ThreadMemberScope.ADMIN],
      },
      otherMembers: [
        {
          address: dappAccountAddress.toString(),
          // We give the dapp WRITE privileges to send the user notifications in this thread.
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
