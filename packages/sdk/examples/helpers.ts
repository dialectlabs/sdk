import {
  CreateThreadCommand,
  Dialect,
  DialectCloudEnvironment,
  DialectSdk,
  FindThreadByIdQuery,
  SendMessageCommand,
  Thread,
  ThreadId,
  ThreadMemberScope,
  ThreadMessage,
} from '@dialectlabs/sdk';
import {
  NodeDialectSolanaWalletAdapter,
  Solana,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import {
  Aptos,
  AptosSdkFactory,
  NodeDialectAptosWalletAdapter,
} from '@dialectlabs/blockchain-sdk-aptos';

/*
  Solana
*/

export function createSolanaSdk(): DialectSdk<Solana> {
  const environment: DialectCloudEnvironment = 'local-development';

  const sdk = Dialect.sdk(
    {
      environment,
    },
    SolanaSdkFactory.create({
      // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
      // to your dapp's Solana messaging wallet keypair e.g. [170,23, . . . ,300]
      wallet: NodeDialectSolanaWalletAdapter.create(),
    }),
  );

  return sdk;
}

export async function createSolanaThread(
  sdk: DialectSdk<Solana>,
  recipient: string,
): Promise<Thread> {
  const command: CreateThreadCommand = {
    encrypted: false,
    me: {
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
    otherMembers: [
      {
        address: recipient,
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

export async function getSolanaThreads(
  sdk: DialectSdk<Solana>,
): Promise<Thread[]> {
  const threads: Thread[] = await sdk.threads.findAll();
  return threads;
}

export async function getSolanaMessages(
  sdk: DialectSdk<Solana>,
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

/*
  Aptos
*/

export function createAptosSdk(): DialectSdk<Aptos> {
  const environment: DialectCloudEnvironment = 'local-development';

  const sdk = Dialect.sdk(
    {
      environment,
    },
    AptosSdkFactory.create({
      // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
      // to your dapp's Aptos messaging wallet keypair
      wallet: NodeDialectAptosWalletAdapter.create(),
    }),
  );

  return sdk;
}

export async function createAptosThread(
  sdk: DialectSdk<Aptos>,
  recipient: string,
): Promise<Thread> {
  // console.log({recipient: recipient.slice(2)});
  // const decoded = bs58.decode(recipient.slice(2));
  // console.log({decoded});
  const command: CreateThreadCommand = {
    encrypted: false,
    me: {
      scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
    },
    otherMembers: [
      {
        address: recipient,
        scopes: [ThreadMemberScope.ADMIN, ThreadMemberScope.WRITE],
      },
    ],
  };
  const thread = await sdk.threads.create(command);
  console.log({ thread });
  return thread;
}

export async function getAptosThreads(
  sdk: DialectSdk<Aptos>,
): Promise<Thread[]> {
  const threads: Thread[] = await sdk.threads.findAll();
  return threads;
}

export async function getAptosMessages(
  sdk: DialectSdk<Aptos>,
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
