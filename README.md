# SDK

The Dialect SDK is a single typescript library for interacting with Dialect's on and off chain resources. These resources include:

*Messaging*

All messaging, user to user or dapp to user, is powered by the same Dialect messaging protocol, which supports both on and off chain messaging.

- Vewing all message threads
- Creating & deleting threads
- Sending & receiving messages within threads

*Dapp Notifications & Subscriptions*

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

Run the [`create-sdk` example script](examples/create-sdk.ts).

To use the Dialect SDK, you'll need to create an SDK client with an assigned wallet to:

```typescript
import {
  Backend,
  ConfigProps,
  Dialect,
  DialectWalletAdapterWrapper,
  EncryptionKeysStore,
  NodeDialectWalletAdapter,
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
const wallet = DialectWalletAdapterWrapper.create(
  NodeDialectWalletAdapter.create(),
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

To do.

### Send a message

To do.

### Delete a thread

To do.

## Dapp Notifications & Subscriptions

To do.
