import { PublicKey } from '@solana/web3.js';
import type {
  CreateThreadCommand,
  DialectSdk,
  FindThreadByIdQuery,
  Thread,
  ThreadId,
  ThreadMessage,
} from '../src';
import {
  Backend,
  ConfigProps,
  Dialect,
  DialectWalletAdapterWrapper,
  EncryptionKeysStore,
  NodeDialectWalletAdapter,
  SendMessageCommand,
  ThreadMemberScope,
  TokenStore,
} from '../src';

export function createSdk(): DialectSdk {
  let secretKey: Uint8Array;
  // secretKey = new Uint8Array([]);
  // console.log({secretKey});

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
  // const keypair = Keypair.fromSecretKey(secretKey);
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

  return sdk;
}

export async function createThread(
  sdk: DialectSdk,
  recipient: PublicKey,
): Promise<Thread> {
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
  const thread = await sdk.threads.create(command);
  console.log({ thread });
  return thread;
}

export async function sendMessage(thread: Thread, text: string): Promise<void> {
  const command: SendMessageCommand = {
    text,
  };
  return await thread.send(command);
}

export async function getThreads(sdk: DialectSdk): Promise<Thread[]> {
  const threads: Thread[] = await sdk.threads.findAll();
  return threads;
}

export async function getMessages(
  sdk: DialectSdk,
  threadId: ThreadId,
): Promise<ThreadMessage[]> {
  const query: FindThreadByIdQuery = {
    id: threadId,
  };
  const thread = await sdk.threads.find(query);
  if (!thread) {
    console.log('No thread found with id', threadId);
    return [];
  }
  console.log({ thread });
  const messages = await thread.messages();
  console.log({ messages });
  return messages;
}
