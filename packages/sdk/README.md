# SDK

## Overview

The Dialect SDK is a single typescript library for interacting with Dialect's on and off chain resources. These resources include:

### Messaging

All messaging, user to user or dapp to user, is powered by the same Dialect messaging protocol, which supports both on and off chain messaging. With the messaging SDK you can:

- view all message threads
- create & delete threads, &
- send & receive messages within threads.

### Dapp Notifications & Subscriptions

In addition to general messaging, Dialect supports an API for dapps to send notifications to their users, both via the Dialect messaging protocols, as well as via web2 channels, including email, Telegram, & SMS.

To support this, the Dialect SDK includes APIs for:

- dapps to register themselves using their messaging keypair.
- wallets to opt in to receiving messages from dapps.
- wallets to configure what channels they'd like to receive dapp messages to, including wallet (using Dialect's protocol), email, Telegram, & SMS.

### Authentication

- For all on-chain transactions, authentication & authorization is baked in since wallets must sign all transactions.
- For all off-chain requests, the Dialect API requires all requests to be authenticated using the wallet `signMessage` method, which proves that the entity making the request has custody of the wallet keypair in question.

## Messaging

### Create an SDK client & connect your wallet to it

Run the [`create-solana-sdk` example script](examples/create-solana-sdk.ts).

To use the Dialect SDK, you'll need to create an SDK client with an assigned wallet to:

```typescript
import {
  Backend,
  ConfigProps,
  Dialect,
  DialectSolanaWalletAdapterWrapper,
  EncryptionKeysStore,
  NodeDialectSolanaWalletAdapter,
  TokenStore,
} from '@dialectlabs/sdk';
import type {
  DialectSdk,
} from '@dialectlabs/sdk';

// Backends tell the SDK where messages can be sent and received to, & in what priority.
const backends = [Backend.DialectCloud, Backend.Solana];
// Provide configuration options for how to target the DialectCloud backend
const dialectCloud = {
  url: 'https://dialectapi.to',
  // Provide a keystore for storing authentication headers, which are expiring tokens generated from the wallet's signMessage method
  tokenStore: TokenStore.createInMemory(),
};
// Convenience for setting smart defaults for backends. Variables above are optional if this is provided.
const environment = 'production';
// Provide a keystore for storing e.g. encryption & decryption keys.
const encryptionKeysStore = EncryptionKeysStore.createInMemory();
// Provide override parameters for Solana backend configuration, including RPC url
const solana = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
};
// A node wallet for running in a node environment. N.b. this would be a mobile or web wallet object instead. The Wrapper class handles conversion to the API expected by the Dialect SDK, but is mostly consistent with expected wallet APIs.
const wallet = DialectSolanaWalletAdapterWrapper.create(
  // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
  // to your dapp's Solana messaging wallet keypair e.g. [170,23, . . . ,300]
  NodeDialectSolanaWalletAdapter.create(),
);

// Now construct the SDK client from all of the above
const sdk: DialectSdk = Dialect.sdk({
  backends,
  dialectCloud,
  environment,
  encryptionKeysStore,
  solana,
  wallet,
} as ConfigProps);
```

### Get existing threads for a wallet

Run the [`get-threads` example script](examples/get-threads.ts).

```typescript
import type {
  // ... previous imports
  Thread,
  ThreadId,
} from '@dialectlabs/sdk';

// ... code from previous examples

// Fetch all threads the wallet is a part of, across all provided backends
const threads: Thread[] = await sdk.threads.findAll();
```

Note that the threads returned here are fetched from both on- and off-chain backends: `Backends.Solana` & `Backends.DialectCloud`.

### Get a thread by its id & read thread messages

Run the [`get-messages` example script](examples/get-messages.ts).

```typescript
import type {
  // ... previous imports
  Message,
} from '@dialectlabs/sdk';

// ... code from previous examples

// Choose a given thread
const thread = threads[0];

// Fetch for a single thread by its id. N.b. the ThreadId type specifies both the address of the thread *as well as* the specified backend; threads of a given id may exist in any kind of backend. See the ThreadId type.
const query: FindThreadByIdQuery = {
  id: thread.id,
}
const thread = await sdk.threads.find(query);
// Call the messages() method to read messages
const messages = await thread.messages();
```

### Create a new thread

Run the [`create-thread` example script](examples/create-thread.ts).

```typescript
import type {
  // ... previous imports
  ThreadMemberScope,
} from '@dialectlabs/sdk';

const recipient = new PublicKey('3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk') // Make this arbitrary
const command: CreateThreadCommand = {
  encrypted: false,
  me: {
    scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
  },
  otherMembers: [
    {
      publicKey: recipient,
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
  ],
};
// Uses the default backend.DialectCloud offchain. The command above may optionally take a preferred backend.
const thread = await sdk.threads.create(command);
```

### Send a message

Run the [`send-message` example script](examples/send-message.ts).

```typescript
// ... code from previous examples

const text = 'gm world';
const command: SendMessageCommand = {
  text,
}
await thread.send(command);
```

### Delete a thread

Run the [`delete-thread` example script](examples/delete-thread.ts).

```typescript
const threadId = thread.id; // Keep for re-querying to confirm deletion
await thread.delete();
const query: FindThreadByIdQuery = {
  id: threadId,
};
const refetchedThread = await sdk.threads.find(query); // Will be null
```

## Dapp Notifications & Subscriptions

The following examples describe how to interact use the Dialect SDK to manage dapp and notification related resources.

### Register a dapp

To allow users to subscribe to notifications from you, you first need to create a dapp in the Dialect API.

```typescript
// Construct the SDK client from all of the above. Let's use 'development' for the environment, and pass
const environment = 'development';
const dialectCloud = {
  // N.b. we omit the url value here, since 'development' will default to https://dev.dialectapi.to.
  tokenStore: TokenStore.createInMemory(),
};
// Use ConfigProps values from example above.
const sdk: DialectSdk = Dialect.sdk({
  backends,
  dialectCloud,
  environment,
  encryptionKeysStore,
  solana,
  wallet,
} as ConfigProps);

// N.b. this created dapp is associated with the wallet public key connected to the sdk instance.
const dapp = await sdk.dapps.create({
  name: 'My test dapp',
  description: `My test dapp's description.`
});
```

Note that all dapps created with Dialect must be associated with a wallet keypair. This keypair will be used for all authenticated requests made for the dapp, and for all user messaging.

The `sdk.dapps.create` method above uses the wallet public key connected to the `sdk` client instance.

You can only create one dapp per public key.

**Dapp whitelist**

Dialect manages a list of verified dapps that have integrated with Dialect. While all messaging is done via wallets and keypairs and sent along the core messaging rails, this whitelist is convenient for surfacing just messages that are specifically from the most well-known dapps on Solana.

Whether or not this list continues to be maintained is to be determined.

If you'd like to be added to this list, please reach out to us on [twitter](https://twitter.com/saydialect) or email us at hello@dialect.to.

### Get your dapp

If the wallet you've connected to your `sdk` client instance is associated with a dapp, you can get the dapp record by making a simple `find` call.

```typescript
const dapp = await sdk.dapps.find();
```

### Get all dapps

You can query for all registered dapps in the the Dialect API DB.

```typescript
const dapps = await sdk.dapps.findAll();
```

### Fetch all whitelisted dapp messages for a given wallet

The Dialect SDK provides an endpoint for querying all messages from whitelisted dapps for a given wallet. This is convenient for producing a single feed of notifications.

```typescript
// ... code from previous examples

const messages = await sdk.wallet.dappMessages.findAll({
  dappVerified: true,
});
```
