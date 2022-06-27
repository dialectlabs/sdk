# SDK

The Dialect SDK is a single typescript library for interacting with Dialect's on and off chain resources. These resources include:

- 

## Run the examples

## Usage

### Create an SDK client & connect your wallet to it

Run the [`create-sdk` example script](examples/create-sdk.ts).

To use the Dialect SDK, you'll need to create an SDK client with an assigned wallet to:

- make authenticated requests (authenticated via wallet `signMessage`) to the Dialect off chain data service,
- sign transactions to send on-chain messages via Dialect's on chain messaging protocol,
- & other operations.

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

const backends = [Backend.DialectCloud, Backend.Solana];
const dialectCloud = {
  url: 'https://dialectapi.to',
  tokenStore: TokenStore.createInMemory(),
};
const environment = 'production';
const encryptionKeysStore = EncryptionKeysStore.createInMemory();
const solana = {
  rpcUrl: 'https://api.mainnet-beta.solana.com',
};
const wallet = DialectWalletAdapterWrapper.create(
  NodeDialectWalletAdapter.create(),
);

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

const threads: Thread[] = await sdk.threads.findAll();
```

Note that the threads returned here are fetched from both on- and off-chain backends: `Backends.Solana` & `Backends.DialectCloud`.

### Get a thread by its id, read messages

Run the [`get-messages` example script](examples/get-messages.ts).

```typescript
import type {
  // ... previous imports
  Message,
} from '@dialectlabs/sdk';

// ... code from previous examples

const thread = threads[0];

const query: FindThreadByIdQuery = {
  id: thread.id,
}
const thread = await sdk.threads.find(query);
const messages = await thread.messages();
```
