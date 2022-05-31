// https://api.mainnet-beta.solana.com
// https://api.devnet.solana.com
// https://localhost:8899

import { Keypair } from '@solana/web3.js';
import { DialectMemberScope } from '../src/messaging.interface';
import { DialectSdk } from '../src/sdk';
import { SessionStorageTokenStore } from '../src/internal/data-service-api/token-store';
import { DialectWalletAdapter, NodeDialectWalletAdapter } from '../src';

const wallet: DialectWalletAdapter = NodeDialectWalletAdapter.create();

/*
 * Case 1: Decentralized inbox
 * */
async function decentalizedInbox() {
  const sdk = DialectSdk.create({
    environment: 'production',
    wallet,
    dialectCloud: {
      tokenStore: new SessionStorageTokenStore(), // Optionally use session storage to store token
    },
  });
  const dialects = sdk.dialects.findAll();
  const dialect = await sdk.dialects.create({
    me: {
      scopes: [DialectMemberScope.WRITE],
    },
    otherMember: {
      publicKey: Keypair.generate().publicKey,
      scopes: [DialectMemberScope.ADMIN],
    },
    encrypted: false,
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
  const wallet: NodeDialectWalletAdapter = NodeDialectWalletAdapter.create();
  const dAppPublicKey = new Keypair().publicKey;
  const sdk = DialectSdk.create({
    environment: 'production',
    wallet,
    dialectCloud: {
      tokenStore: new SessionStorageTokenStore(), // Optionally use session storage to store token
    },
  });
  const dialect = await sdk.dialects.create({
    me: {
      scopes: [],
    },
    otherMember: {
      publicKey: dAppPublicKey,
      scopes: [DialectMemberScope.WRITE],
    },
    encrypted: false,
  });
  const allDialects = await sdk.dialects.findAll();
  const foundByMember = await sdk.dialects.find({ otherMember: dAppPublicKey });
  if (foundByMember) {
    await foundByMember.delete();
  }
  const foundByAddress = await sdk.dialects.find({
    publicKey: dialect.publicKey,
  });
  if (foundByAddress) {
    await foundByAddress.delete();
  }
}

/*
 * Case 3: Monitoring service dialectThreadSink
 * */
async function monitoringServiceDialectThreadSink() {
  const wallet: NodeDialectWalletAdapter = NodeDialectWalletAdapter.create();
  const dAppPublicKey = new Keypair().publicKey;

  const subscriber = Keypair.generate().publicKey;

  const sdk = DialectSdk.create({
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
  const wallet: NodeDialectWalletAdapter = NodeDialectWalletAdapter.create();
  const dAppPublicKey = new Keypair().publicKey;
  const sdk = DialectSdk.create({
    environment: 'production',
    wallet,
    dialectCloud: {
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
