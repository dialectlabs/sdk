// https://api.mainnet-beta.solana.com
// https://api.devnet.solana.com
// https://localhost:8899

import { Keypair } from '@solana/web3.js';
import { EmbeddedWallet } from './wallet';
import type { Wallet } from './wallet-interfaces';
import { DialectMemberRole } from './messaging/internal/messaging.interface';
import { DialectSDK } from './sdk';
import { SessionStorageTokenStore } from './data-service-api/token-store';

const wallet: Wallet = EmbeddedWallet.create();

/*
 * Case 1: Decentralized inbox
 * */
async function decentalizedInbox() {
  const sdk = DialectSDK.create({
    environment: 'production',
    wallet,
    web2: {
      tokenStore: new SessionStorageTokenStore(), // Optionally use session storage to store token
    },
  });
  const dialects = sdk.dialects.list();
  const dialect = await sdk.dialects.create({
    me: {
      roles: [DialectMemberRole.Writer],
    },
    otherMember: {
      publicKey: Keypair.generate().publicKey,
      roles: [DialectMemberRole.Owner],
    },
    enableEncryption: false,
  });
  await dialect.send({
    text: 'Hello world!',
  });
  await dialect.delete();
}

/*
 * Case 2: Notification center
 * */
async function notificaitonCenter() {
  const wallet: EmbeddedWallet = EmbeddedWallet.create();
  const dAppPublicKey = new Keypair().publicKey;
  const sdk = DialectSDK.create({
    environment: 'production',
    wallet,
    web2: {
      tokenStore: new SessionStorageTokenStore(), // Optionally use session storage to store token
    },
  });
  const dialect = await sdk.dialects.create({
    me: {
      roles: [],
    },
    otherMember: {
      publicKey: dAppPublicKey,
      roles: [DialectMemberRole.Writer],
    },
    enableEncryption: false,
  });
  const allDialects = await sdk.dialects.list();
  const foundByMember = await sdk.dialects.find({ otherMember: dAppPublicKey });
  if (foundByMember) {
    await foundByMember.delete();
  }
  const foundByAddress = await sdk.dialects.find({
    address: dialect.address,
  });
  if (foundByAddress) {
    await foundByAddress.delete();
  }
}

/*
 * Case 3: Monitoring service dialectThreadSink
 * */
async function monitoringServiceDialectThreadSink() {
  const wallet: EmbeddedWallet = EmbeddedWallet.create();
  const dAppPublicKey = new Keypair().publicKey;

  const subscriber = Keypair.generate().publicKey;

  const sdk = DialectSDK.create({
    environment: 'development',
    wallet,
  });

  const dialect = await sdk.dialects.find({ otherMember: subscriber });
  if (dialect) {
    await dialect.send({
      text: 'Notification',
    });
  }
}

/*
 * Future case 4: Monitoring service & CLI
 * */
async function monitoringServiceAndCli() {
  const wallet: EmbeddedWallet = EmbeddedWallet.create();
  const dAppPublicKey = new Keypair().publicKey;
  const sdk = DialectSDK.create({
    environment: 'production',
    wallet,
    web2: {
      tokenStore: new SessionStorageTokenStore(), // Optionally use session storage to store token
    },
  });
  const dapp = await sdk.dapps.find({ publicKey: dAppPublicKey });
  const subscribers = await dapp?.subscribers.list(); // Provides access to dApp subscribers
  dapp &&
    (await dapp.notify({
      // Under the hood the notification will be sent to both web2 and web3 sources
      title: 'title',
      message: 'hello worlkd',
    }));

  dapp &&
    (await dapp.notify({
      title: 'title',
      message: 'hello worlkd',
      wallets: [Keypair.generate().publicKey, Keypair.generate().publicKey],
    }));
}
