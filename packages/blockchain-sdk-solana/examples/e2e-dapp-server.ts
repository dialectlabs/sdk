/*
  This is one of two files for testing end-to-end user subscriptions and notifications.
  This file manages the "server" — where the project wishing to message its users can
  send messages.
*/

import { BlockchainType, Dialect, DialectSdk } from '@dialectlabs/sdk';
import {
  NodeDialectSolanaWalletAdapter,
  Solana,
  SolanaSdkFactory,
} from '../src';

// Initialize an SDK for interacting with Dialect services. All SDKs have a wallet tied
// to them for authentication purposes. In this case, we are initializing an sdk for the
// dapp, wallet or project who wishes to build an audience and send notifications to
// that audience.

// NOTE: This private key is for demonstration purposes only! Dialect's SolanaSdkFactory
// is compatible with any wallet adapter standard that supports signMessage,
// signTransaction, etc. The private key is not a requirement at all for using Dialect's
// tooling, and is actively discouraged.
const sdk: DialectSdk<Solana> = Dialect.sdk(
  {
    environment: 'production',
  },
  SolanaSdkFactory.create({
    wallet: NodeDialectSolanaWalletAdapter.create(), // don't forget to set DIALECT_SDK_CREDENTIALS env var to dapp wallet private key
  }),
);

console.log(`Server wallet address: ${sdk.wallet.address}`);

async function main() {
  // First, we register the sending keypair as a "dapp" (this is any project that wants to
  // have users subscribe to receive notifications).
  const dapp = await getOrRegisterDapp();

  console.log(`Dapp id: ${dapp.id}`);

  // Next, for the purposes of this demo, you can type in messages you'd like to send
  // directly from the terminal here. These will then be received by any subscribers. To
  // create a subscriber, please visit the other example file.
  console.log('Start typing messages to send to the client...');
  process.stdin.on('readable', () => {
    let message;
    while ((message = process.stdin.read()) !== null) {
      console.log(`Sending message ${message}...`);
      dapp.messages
        .send({
          title: 'New notification',
          message: message.toString(),
        })
        .catch((e) => console.error(e));
    }
  });
}

main().catch((e) => console.error(e));

async function getOrRegisterDapp() {
  // Here, we register the senderSdk as a "dapp". This simply means the sending wallet
  // is being registered in Dialect's infrastructure as a keypair that other wallets
  // can subscribe to receive notifications from. If there is already a dapp registered
  // for this wallet, we find that first and return it.
  let dapp = await sdk.dapps.find();
  if (!dapp) {
    console.log(`Dapp not found, creating it...`);
    const createdDapp = await sdk.dapps.create({
      name: 'Example dapp',
      description: 'Example dapp description.',
      blockchainType: BlockchainType.SOLANA,
    });
    console.log(
      `Dapp created. Name: ${dapp!.name}; description: ${
        dapp!.description
      }; messaging address: ${dapp!.address})`,
    );

    return createdDapp;
  }
  return dapp.messages.send({});
}
