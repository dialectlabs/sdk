import {
  BlockchainSdk,
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
import { Aptos, AptosSdkFactory, NodeDialectAptosWalletAdapter } from '../src';

export function createAptosSdk(): DialectSdk<Aptos> {
  const environment: DialectCloudEnvironment = 'local-development';

  return Dialect.sdk(
    {
      environment,
    },
    AptosSdkFactory.create({
      // IMPORTANT: must set environment variable DIALECT_SDK_CREDENTIALS
      // to your dapp's Aptos messaging wallet keypair
      wallet: NodeDialectAptosWalletAdapter.create(),
    }),
  );
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
  return await sdk.threads.findAll();
}

export async function getAptosMessages(
  sdk: DialectSdk<Aptos>,
  threadId: ThreadId,
): Promise<ThreadMessage[]> {
  return getMessages(sdk, threadId);
}

async function getMessages(sdk: DialectSdk<BlockchainSdk>, threadId: ThreadId) {
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

export async function sendMessage(thread: Thread, text: string): Promise<void> {
  const command: SendMessageCommand = {
    text,
  };
  return await thread.send(command);
}
